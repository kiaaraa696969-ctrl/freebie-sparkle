import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { MessageSquare, ThumbsUp, ThumbsDown, Trash2, Reply, Send, LogIn, Shield, Crown } from 'lucide-react';

import { formatDistanceToNow } from 'date-fns';
import { toast } from 'sonner';

interface Comment {
  id: string;
  account_id: string;
  user_id: string;
  parent_id: string | null;
  content: string;
  created_at: string;
  profile?: { display_name: string | null; avatar_url: string | null } | null;
  isCommentAuthorAdmin: boolean;
  isCommentAuthorVip: boolean;
  likes: number;
  dislikes: number;
  userReaction: 'like' | 'dislike' | null;
  replies: Comment[];
}

interface CommentSectionProps {
  accountId: string;
}

export function CommentSection({ accountId }: CommentSectionProps) {
  const { user, isAdmin } = useAuth();
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [newComment, setNewComment] = useState('');
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [replyContent, setReplyContent] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const fetchComments = useCallback(async () => {
    const { data: rawComments } = await supabase
      .from('comments')
      .select('*')
      .eq('account_id', accountId)
      .order('created_at', { ascending: true });

    if (!rawComments) { setLoading(false); return; }

    const userIds = [...new Set(rawComments.map(c => c.user_id))];
    const { data: profiles } = await supabase
      .from('profiles')
      .select('user_id, display_name, avatar_url')
      .in('user_id', userIds);

    const profileMap = new Map(profiles?.map(p => [p.user_id, p]) || []);

    // Fetch admin roles for commenters
    const { data: adminRoles } = await supabase
      .from('user_roles')
      .select('user_id')
      .eq('role', 'admin')
      .in('user_id', userIds);
    const adminSet = new Set(adminRoles?.map(r => r.user_id) || []);

    // Fetch VIP status for commenters
    const { data: vipData } = await supabase
      .from('vip_subscriptions')
      .select('user_id')
      .in('user_id', userIds)
      .gt('expires_at', new Date().toISOString());
    const vipSet = new Set(vipData?.map(v => v.user_id) || []);

    const commentIds = rawComments.map(c => c.id);
    const { data: reactions } = await supabase
      .from('comment_reactions')
      .select('*')
      .in('comment_id', commentIds);

    const commentsWithMeta: Comment[] = rawComments.map(c => {
      const commentReactions = reactions?.filter(r => r.comment_id === c.id) || [];
      return {
        ...c,
        profile: profileMap.get(c.user_id) || null,
        isCommentAuthorAdmin: adminSet.has(c.user_id),
        isCommentAuthorVip: vipSet.has(c.user_id),
        likes: commentReactions.filter(r => r.reaction_type === 'like').length,
        dislikes: commentReactions.filter(r => r.reaction_type === 'dislike').length,
        userReaction: user ? (commentReactions.find(r => r.user_id === user.id)?.reaction_type as 'like' | 'dislike' | null) || null : null,
        replies: [],
      };
    });

    const topLevel: Comment[] = [];
    const byId = new Map(commentsWithMeta.map(c => [c.id, c]));
    for (const c of commentsWithMeta) {
      if (c.parent_id && byId.has(c.parent_id)) {
        byId.get(c.parent_id)!.replies.push(c);
      } else {
        topLevel.push(c);
      }
    }

    setComments(topLevel);
    setLoading(false);
  }, [accountId, user]);

  useEffect(() => { fetchComments(); }, [fetchComments]);

  useEffect(() => {
    const channel = supabase
      .channel(`comments-${accountId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'comments', filter: `account_id=eq.${accountId}` }, () => {
        fetchComments();
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [accountId, fetchComments]);

  const handleSubmit = async (parentId: string | null = null) => {
    const content = parentId ? replyContent.trim() : newComment.trim();
    if (!content || !user || submitting) return;
    if (content.length > 500) { toast.error('Comment too long (max 500 chars)'); return; }

    setSubmitting(true);
    const { error } = await supabase.from('comments').insert({
      account_id: accountId,
      user_id: user.id,
      parent_id: parentId,
      content,
    });

    if (error) {
      toast.error('Failed to post comment');
    } else {
      if (parentId) { setReplyContent(''); setReplyingTo(null); }
      else { setNewComment(''); }
      fetchComments();
    }
    setSubmitting(false);
  };

  const handleReaction = async (commentId: string, type: 'like' | 'dislike') => {
    if (!user) { toast.error('Login to react'); return; }

    const comment = findComment(comments, commentId);
    if (comment?.userReaction === type) {
      await supabase.from('comment_reactions').delete()
        .eq('comment_id', commentId)
        .eq('user_id', user.id)
        .eq('reaction_type', type);
    } else {
      await supabase.from('comment_reactions').delete()
        .eq('comment_id', commentId)
        .eq('user_id', user.id);
      await supabase.from('comment_reactions').insert({
        comment_id: commentId,
        user_id: user.id,
        reaction_type: type,
      });
    }
    fetchComments();
  };

  const handleDelete = async (commentId: string) => {
    const { error } = await supabase.from('comments').delete().eq('id', commentId);
    if (error) toast.error('Failed to delete');
    else fetchComments();
  };

  const findComment = (list: Comment[], id: string): Comment | null => {
    for (const c of list) {
      if (c.id === id) return c;
      const found = findComment(c.replies, id);
      if (found) return found;
    }
    return null;
  };

  return (
    <section className="bg-card border border-border rounded-2xl p-6 sm:p-8" aria-label="Comments">
      <div className="flex items-center gap-2.5 mb-6">
        <MessageSquare className="w-5 h-5 text-primary" />
        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
          Comments ({comments.reduce((acc, c) => acc + 1 + c.replies.length, 0)})
        </h2>
      </div>

      {user ? (
        <div className="flex gap-3 mb-8">
          <Avatar className="w-8 h-8 shrink-0 mt-1">
            <AvatarImage src={undefined} />
            <AvatarFallback className="text-xs bg-primary/10 text-primary">
              {user.email?.[0]?.toUpperCase() || 'U'}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 relative">
            <textarea
              value={newComment}
              onChange={e => setNewComment(e.target.value)}
              placeholder="Write a comment..."
              maxLength={500}
              rows={2}
              className="w-full rounded-xl border border-border bg-muted/50 px-4 py-3 pr-12 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring resize-none"
            />
            <button
              onClick={() => handleSubmit(null)}
              disabled={!newComment.trim() || submitting}
              className="absolute right-3 bottom-3 text-primary hover:text-primary/80 disabled:opacity-30 cursor-pointer"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
        </div>
      ) : (
        <a href="/auth" className="flex items-center gap-2 text-sm text-primary hover:underline mb-6">
          <LogIn className="w-4 h-4" /> Sign in to comment
        </a>
      )}

      {loading ? (
        <div className="flex justify-center py-8">
          <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      ) : comments.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-6">No comments yet. Be the first!</p>
      ) : (
        <div className="space-y-5">
          {comments.map(comment => (
            <CommentItem
              key={comment.id}
              comment={comment}
              user={user}
              isAdmin={isAdmin}
              replyingTo={replyingTo}
              replyContent={replyContent}
              submitting={submitting}
              onReply={setReplyingTo}
              onReplyContentChange={setReplyContent}
              onSubmitReply={(parentId) => handleSubmit(parentId)}
              onReaction={handleReaction}
              onDelete={handleDelete}
            />
          ))}
        </div>
      )}
    </section>
  );
}

interface CommentItemProps {
  comment: Comment;
  user: any;
  isAdmin: boolean;
  replyingTo: string | null;
  replyContent: string;
  submitting: boolean;
  onReply: (id: string | null) => void;
  onReplyContentChange: (v: string) => void;
  onSubmitReply: (parentId: string) => void;
  onReaction: (commentId: string, type: 'like' | 'dislike') => void;
  onDelete: (commentId: string) => void;
  depth?: number;
}

function CommentItem({
  comment, user, isAdmin, replyingTo, replyContent, submitting,
  onReply, onReplyContentChange, onSubmitReply, onReaction, onDelete, depth = 0,
}: CommentItemProps) {
  const canDelete = user && (user.id === comment.user_id || isAdmin);
  const displayName = comment.profile?.display_name || 'Anonymous';
  const initial = displayName[0]?.toUpperCase() || 'A';
  const isReplying = replyingTo === comment.id;

  return (
    <div className={depth > 0 ? 'ml-6 sm:ml-10 border-l-2 border-border pl-4' : ''}>
      <div className="flex gap-3">
        <Avatar className="w-7 h-7 shrink-0 mt-0.5">
          <AvatarImage src={comment.profile?.avatar_url || undefined} />
          <AvatarFallback className="text-xs bg-muted text-muted-foreground">{initial}</AvatarFallback>
        </Avatar>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm font-semibold text-foreground">{displayName}</span>
            {comment.isCommentAuthorAdmin && (
              <span className="inline-flex items-center gap-0.5 text-[10px] font-bold bg-primary/10 text-primary px-1.5 py-0.5 rounded-full">
                <Shield className="w-2.5 h-2.5" />
                Admin
              </span>
            )}
            {comment.isCommentAuthorVip && !comment.isCommentAuthorAdmin && (
              <span className="inline-flex items-center gap-0.5 text-[10px] font-bold bg-amber-500/10 text-amber-600 px-1.5 py-0.5 rounded-full">
                <Crown className="w-2.5 h-2.5" />
                VIP
              </span>
            )}
            <span className="text-xs text-muted-foreground">
              {formatDistanceToNow(new Date(comment.created_at), { addSuffix: true })}
            </span>
          </div>
          <p className="text-sm text-foreground/90 mt-1 whitespace-pre-wrap break-words">{comment.content}</p>

          <div className="flex items-center gap-3 mt-2">
            <button
              onClick={() => onReaction(comment.id, 'like')}
              className={`flex items-center gap-1 text-xs cursor-pointer transition-colors ${comment.userReaction === 'like' ? 'text-primary font-semibold' : 'text-muted-foreground hover:text-foreground'}`}
            >
              <ThumbsUp className="w-3.5 h-3.5" /> {comment.likes > 0 && comment.likes}
            </button>
            <button
              onClick={() => onReaction(comment.id, 'dislike')}
              className={`flex items-center gap-1 text-xs cursor-pointer transition-colors ${comment.userReaction === 'dislike' ? 'text-destructive font-semibold' : 'text-muted-foreground hover:text-foreground'}`}
            >
              <ThumbsDown className="w-3.5 h-3.5" /> {comment.dislikes > 0 && comment.dislikes}
            </button>
            {user && depth === 0 && (
              <button
                onClick={() => onReply(isReplying ? null : comment.id)}
                className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground cursor-pointer"
              >
                <Reply className="w-3.5 h-3.5" /> Reply
              </button>
            )}
            {canDelete && (
              <button
                onClick={() => onDelete(comment.id)}
                className="flex items-center gap-1 text-xs text-muted-foreground hover:text-destructive cursor-pointer ml-auto"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {isReplying && (
            <div className="flex gap-2 mt-3">
              <textarea
                autoFocus
                value={replyContent}
                onChange={e => onReplyContentChange(e.target.value)}
                placeholder="Write a reply..."
                maxLength={500}
                rows={1}
                className="flex-1 rounded-lg border border-border bg-muted/50 px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring resize-none"
              />
              <button
                onClick={() => onSubmitReply(comment.id)}
                disabled={!replyContent.trim() || submitting}
                className="text-primary hover:text-primary/80 disabled:opacity-30 cursor-pointer px-2"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      </div>

      {comment.replies.length > 0 && (
        <div className="mt-4 space-y-4">
          {comment.replies.map(reply => (
            <CommentItem
              key={reply.id}
              comment={reply}
              user={user}
              isAdmin={isAdmin}
              replyingTo={replyingTo}
              replyContent={replyContent}
              submitting={submitting}
              onReply={onReply}
              onReplyContentChange={onReplyContentChange}
              onSubmitReply={onSubmitReply}
              onReaction={onReaction}
              onDelete={onDelete}
              depth={depth + 1}
            />
          ))}
        </div>
      )}
    </div>
  );
}
