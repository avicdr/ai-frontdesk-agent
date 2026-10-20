'use client';

// src/app/dashboard/conversations/page.tsx
// Clinic Conversation Inbox with real-time timeline, human takeover, scrollable feed, and contact info

import React, { useState, useEffect, useRef } from 'react';

interface Conversation {
  id: string;
  patient_phone: string;
  patient_name?: string | null;
  status: string;
  owner: string;
  last_message_at: string;
  handoff_reason?: string;
}

interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system' | 'patient';
  content: string;
  created_at: string;
  metadata?: any;
}

/**
 * Formats a phone number or WhatsApp LID identifier into a friendly display format.
 */
function formatContactNumber(phone: string): string {
  if (!phone) return 'Unknown Contact';
  const clean = phone.replace(/[^0-9]/g, '');

  // If 15-digit WhatsApp Linked Identity ID (LID)
  if (clean.length >= 14 && !clean.startsWith('91')) {
    return `WA ID: ${clean.slice(0, 4)}••••${clean.slice(-4)}`;
  }

  // If Indian country code 91 + 10 digits
  if (clean.startsWith('91') && clean.length === 12) {
    return `+91 ${clean.slice(2, 7)}-${clean.slice(7)}`;
  }

  // If 10 digit mobile
  if (clean.length === 10) {
    return `+91 ${clean.slice(0, 5)}-${clean.slice(5)}`;
  }

  return `+${clean}`;
}

/**
 * Sanitizes message text so older messages with raw JSON formatting
 * or markdown code fences are rendered cleanly as normal conversation text.
 */
function formatMessageContent(content: string): string {
  if (!content) return '';
  const trimmed = content.trim();

  if (trimmed.startsWith('{') || trimmed.startsWith('```') || trimmed.startsWith('json\n')) {
    try {
      const cleaned = trimmed
        .replace(/^```(?:json)?\s*/i, '')
        .replace(/\s*```$/i, '')
        .replace(/^json\s*/i, '')
        .trim();
      const parsed = JSON.parse(cleaned);
      if (parsed && typeof parsed.user_message === 'string' && parsed.user_message.trim().length > 0) {
        return parsed.user_message;
      }
      if (parsed && typeof parsed.message === 'string' && parsed.message.trim().length > 0) {
        return parsed.message;
      }
    } catch {}
  }

  return content;
}

export default function ConversationsPage() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConvId, setSelectedConvId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [replyText, setReplyText] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [actionInProgress, setActionInProgress] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom of chat on new messages or tab switch
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loadingMessages]);

  // Load conversations list
  useEffect(() => {
    async function loadConversations() {
      try {
        const res = await fetch('/api/v1/conversations');
        const json = await res.json();
        if (json.data?.conversations) {
          setConversations(json.data.conversations);
          if (json.data.conversations.length > 0 && !selectedConvId) {
            setSelectedConvId(json.data.conversations[0].id);
          }
        }
      } catch (e) {
        console.error('Failed to load conversations:', e);
      } finally {
        setLoading(false);
      }
    }
    loadConversations();
  }, []);

  // Load messages for selected conversation
  useEffect(() => {
    if (!selectedConvId) return;

    async function loadMessages() {
      setLoadingMessages(true);
      try {
        const res = await fetch(`/api/v1/conversations?conversationId=${selectedConvId}`);
        const json = await res.json();
        if (json.data?.messages) {
          setMessages(json.data.messages);
        }
      } catch (e) {
        console.error('Failed to load messages:', e);
      } finally {
        setLoadingMessages(false);
      }
    }
    loadMessages();
  }, [selectedConvId]);

  const selectedConv = conversations.find(c => c.id === selectedConvId);

  // Takeover or release
  const handleToggleTakeover = async () => {
    if (!selectedConv) return;
    setActionInProgress(true);
    const action = selectedConv.owner === 'human' ? 'release_to_ai' : 'takeover';

    try {
      await fetch('/api/v1/conversations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ conversationId: selectedConv.id, action }),
      });

      // Update local state
      setConversations(conversations.map(c => 
        c.id === selectedConv.id 
          ? { ...c, owner: action === 'takeover' ? 'human' : 'ai', status: action === 'takeover' ? 'handed_off' : 'active' }
          : c
      ));
    } catch (e) {
      console.error(e);
    } finally {
      setActionInProgress(false);
    }
  };

  // Send manual reply
  const handleSendReply = async () => {
    if (!selectedConv || !replyText.trim()) return;
    setActionInProgress(true);

    try {
      const res = await fetch('/api/v1/conversations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          conversationId: selectedConv.id,
          action: 'send_message',
          message: replyText.trim(),
        }),
      });
      const json = await res.json();
      if (json.data?.message) {
        setMessages(prev => [...prev, json.data.message]);
        setReplyText('');
      }
    } catch (e) {
      console.error(e);
    } finally {
      setActionInProgress(false);
    }
  };

  // Delete a single conversation
  const handleDeleteSingleConversation = async (convId: string) => {
    const target = conversations.find(c => c.id === convId);
    const label = target ? (target.patient_name || formatContactNumber(target.patient_phone)) : 'this conversation';
    if (!confirm(`Are you sure you want to delete the conversation with ${label}? All messages will be permanently deleted.`)) {
      return;
    }

    setIsDeleting(true);
    try {
      const res = await fetch(`/api/v1/conversations?conversationId=${convId}`, {
        method: 'DELETE',
      });
      const json = await res.json();
      if (json.success) {
        const remaining = conversations.filter(c => c.id !== convId);
        setConversations(remaining);
        if (selectedConvId === convId) {
          if (remaining.length > 0) {
            setSelectedConvId(remaining[0].id);
          } else {
            setSelectedConvId(null);
            setMessages([]);
          }
        }
      } else {
        alert(json.error?.message || 'Failed to delete conversation.');
      }
    } catch (e) {
      console.error('Delete conversation error:', e);
      alert('Network error while deleting conversation.');
    } finally {
      setIsDeleting(false);
    }
  };

  // Clear all past conversations
  const handleClearAllConversations = async () => {
    if (conversations.length === 0) return;
    if (!confirm(`Are you sure you want to clear all ${conversations.length} conversation thread(s)? All past patient messages will be permanently removed.`)) {
      return;
    }

    setIsDeleting(true);
    try {
      const res = await fetch('/api/v1/conversations?all=true', {
        method: 'DELETE',
      });
      const json = await res.json();
      if (json.success) {
        setConversations([]);
        setSelectedConvId(null);
        setMessages([]);
      } else {
        alert(json.error?.message || 'Failed to clear conversations.');
      }
    } catch (e) {
      console.error('Clear all conversations error:', e);
      alert('Network error while clearing conversations.');
    } finally {
      setIsDeleting(false);
    }
  };

  // Filter conversations by search term (name or phone)
  const filteredConversations = conversations.filter(c => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return true;
    const phone = (c.patient_phone || '').toLowerCase();
    const name = (c.patient_name || '').toLowerCase();
    return phone.includes(q) || name.includes(q);
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 6rem)', minHeight: 480, overflow: 'hidden' }}>
      {/* Page Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem', flexShrink: 0, flexWrap: 'wrap', gap: '0.5rem' }}>
        <div>
          <h1 style={{ fontSize: 'clamp(1.15rem, 3vw, 1.4rem)', fontWeight: 800, letterSpacing: '-0.02em', margin: 0 }}>
            💬 Patient Conversations & Live Inbox
          </h1>
          <p style={{ color: 'hsl(var(--color-text-muted))', fontSize: '0.8rem', margin: '0.2rem 0 0 0' }}>
            Monitor WhatsApp dialogues, view contact names, take over chats, or let AI handle reception automatically.
          </p>
        </div>

        {conversations.length > 0 && (
          <button
            type="button"
            onClick={handleClearAllConversations}
            disabled={isDeleting}
            className="btn btn-ghost btn-sm"
            style={{
              color: '#f87171',
              border: '1px solid hsla(0, 84%, 60%, 0.25)',
              background: 'hsla(0, 84%, 60%, 0.08)',
              fontSize: '0.75rem',
              padding: '0.4rem 0.8rem',
              borderRadius: '8px',
              display: 'flex',
              alignItems: 'center',
              gap: '0.4rem',
              flexShrink: 0,
            }}
            title="Permanently clear all conversation threads"
          >
            🗑️ {isDeleting ? 'Clearing...' : 'Clear All History'}
          </button>
        )}
      </div>

      {/* Main Container */}
      <div
        className="conversations-grid"
        style={{
          display: 'grid',
          gap: '0',
          flex: 1,
          minHeight: 0,
          height: '100%',
          background: 'hsl(var(--color-surface))',
          border: '1px solid hsl(var(--color-border))',
          borderRadius: '16px',
          overflow: 'hidden',
          position: 'relative',
        }}
      >
        <style jsx>{`
          .conversations-grid {
            grid-template-columns: 340px 1fr;
          }
          @media (max-width: 768px) {
            .conversations-grid {
              grid-template-columns: 1fr;
            }
            .conv-list-panel {
              display: ${selectedConv ? 'none !important' : 'flex !important'};
              width: 100% !important;
              border-right: none !important;
            }
            .conv-chat-panel {
              display: ${selectedConv ? 'flex !important' : 'none !important'};
              width: 100% !important;
            }
            .conv-empty-panel {
              display: none !important;
            }
          }
        `}</style>

        {/* Left Column: Conversation List */}
        <div
          className="conv-list-panel"
          style={{
            borderRight: '1px solid hsl(var(--color-border))',
            display: 'flex',
            flexDirection: 'column',
            height: '100%',
            minHeight: 0,
            background: 'hsl(var(--color-background) / 0.5)',
          }}
        >
          {/* Search bar */}
          <div style={{ padding: '0.875rem 1rem', borderBottom: '1px solid hsl(var(--color-border))', flexShrink: 0 }}>
            <input
              className="input"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              style={{ fontSize: '0.8rem', padding: '0.5rem 0.75rem', width: '100%' }}
              placeholder="Search by name or number..."
            />
          </div>

          {/* Conversation List Scroll Area */}
          <div style={{ overflowY: 'auto', flex: 1, minHeight: 0 }}>
            {loading ? (
              <div style={{ padding: '2rem', textAlign: 'center', color: 'hsl(var(--color-text-muted))', fontSize: '0.85rem' }}>
                Loading conversations...
              </div>
            ) : filteredConversations.length === 0 ? (
              <div style={{ padding: '2rem', textAlign: 'center', color: 'hsl(var(--color-text-muted))', fontSize: '0.85rem' }}>
                {searchQuery ? 'No matching contacts found.' : 'No active conversations yet. Messages sent to your WhatsApp number will appear here!'}
              </div>
            ) : (
              filteredConversations.map(conv => {
                const isSelected = conv.id === selectedConvId;
                const isHandoff = conv.owner === 'human' || conv.status === 'handed_off';
                const formattedNum = formatContactNumber(conv.patient_phone);
                const title = conv.patient_name || formattedNum;

                return (
                  <div
                    key={conv.id}
                    onClick={() => setSelectedConvId(conv.id)}
                    style={{
                      padding: '0.875rem 1rem',
                      borderBottom: '1px solid hsl(var(--color-border))',
                      background: isSelected ? 'hsl(var(--color-primary) / 0.12)' : 'transparent',
                      cursor: 'pointer',
                      borderLeft: isSelected ? '3px solid hsl(var(--color-primary))' : '3px solid transparent',
                      transition: 'background 0.15s ease',
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <div style={{ minWidth: 0, flex: 1, marginRight: '0.5rem' }}>
                        <div style={{
                          fontWeight: 700,
                          fontSize: '0.875rem',
                          color: 'white',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                        }}>
                          {title}
                        </div>
                        {conv.patient_name && (
                          <div style={{ fontSize: '0.75rem', color: 'hsl(var(--color-text-muted))', marginTop: '0.1rem' }}>
                            {formattedNum}
                          </div>
                        )}
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                        <span style={{ fontSize: '0.7rem', color: 'hsl(var(--color-text-muted))', whiteSpace: 'nowrap' }}>
                          {new Date(conv.last_message_at || Date.now()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteSingleConversation(conv.id);
                          }}
                          disabled={isDeleting}
                          style={{
                            background: 'transparent',
                            border: 'none',
                            color: 'hsl(var(--color-text-muted))',
                            cursor: 'pointer',
                            padding: '2px 4px',
                            borderRadius: '4px',
                            fontSize: '0.75rem',
                            lineHeight: 1,
                            opacity: 0.5,
                            transition: 'opacity 0.15s, color 0.15s',
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.opacity = '1';
                            e.currentTarget.style.color = '#ef4444';
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.opacity = '0.5';
                            e.currentTarget.style.color = 'hsl(var(--color-text-muted))';
                          }}
                          title="Delete this conversation"
                        >
                          🗑️
                        </button>
                      </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.35rem' }}>
                      <span className={`badge badge-${isHandoff ? 'warning' : 'success'}`} style={{ fontSize: '0.65rem' }}>
                        {isHandoff ? '🚨 Staff Control' : '🤖 AI Active'}
                      </span>
                      {conv.handoff_reason && (
                        <span style={{ fontSize: '0.7rem', color: 'hsl(var(--color-text-muted))', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {conv.handoff_reason}
                        </span>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Right Column: Active Conversation Timeline */}
        {selectedConv ? (
          <div
            className="conv-chat-panel"
            style={{
              display: 'flex',
              flexDirection: 'column',
              height: '100%',
              minHeight: 0,
              overflow: 'hidden',
            }}
          >
            {/* Thread Header */}
            <div style={{
              padding: '0.75rem clamp(0.75rem, 3vw, 1.25rem)',
              borderBottom: '1px solid hsl(var(--color-border))',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              background: 'hsl(var(--color-surface))',
              flexWrap: 'wrap',
              gap: '0.5rem',
              flexShrink: 0,
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', minWidth: 0 }}>
                {/* Mobile back button */}
                <button
                  type="button"
                  onClick={() => setSelectedConvId(null)}
                  className="show-on-mobile btn btn-ghost btn-sm"
                  style={{
                    padding: '0.35rem 0.6rem',
                    background: 'hsl(var(--color-surface-2))',
                    border: '1px solid hsl(var(--color-border))',
                    borderRadius: '8px',
                    fontSize: '0.85rem',
                  }}
                  title="Back to contacts list"
                >
                  ←
                </button>

                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', minWidth: 0 }}>
                  <span style={{ fontSize: '1.25rem', flexShrink: 0 }}>👤</span>
                  <div style={{ minWidth: 0 }}>
                    <div style={{
                      fontWeight: 800,
                      fontSize: 'clamp(0.9rem, 2.5vw, 1.05rem)',
                      color: 'white',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    }}>
                      {selectedConv.patient_name || formatContactNumber(selectedConv.patient_phone)}
                    </div>
                    {selectedConv.patient_name && (
                      <div style={{ fontSize: '0.75rem', color: 'hsl(var(--color-text-muted))' }}>
                        {formatContactNumber(selectedConv.patient_phone)}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Actions Button Group */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                {/* Delete Single Conversation Button */}
                <button
                  type="button"
                  className="btn btn-ghost btn-sm"
                  onClick={() => handleDeleteSingleConversation(selectedConv.id)}
                  disabled={isDeleting || actionInProgress}
                  style={{
                    fontSize: '0.75rem',
                    padding: '0.4rem 0.65rem',
                    color: '#f87171',
                    border: '1px solid hsla(0, 84%, 60%, 0.25)',
                    background: 'hsla(0, 84%, 60%, 0.05)',
                    borderRadius: '8px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.3rem',
                  }}
                  title="Delete this conversation thread"
                >
                  🗑️ Delete Chat
                </button>

                {/* Takeover Toggle Button */}
                <button
                  type="button"
                  className={`btn ${selectedConv.owner === 'human' ? 'btn-primary' : 'btn-secondary'} btn-sm`}
                  onClick={handleToggleTakeover}
                  disabled={actionInProgress}
                  style={{ fontSize: '0.75rem', padding: '0.4rem 0.75rem' }}
                >
                  {selectedConv.owner === 'human' ? '🤖 Resume AI' : '✋ Take Over'}
                </button>
              </div>
            </div>

            {/* Message History Bubble Feed (Scrollable) */}
            <div style={{
              flex: 1,
              minHeight: 0,
              overflowY: 'auto',
              padding: '1.5rem',
              display: 'flex',
              flexDirection: 'column',
              gap: '1rem',
            }}>
              {loadingMessages ? (
                <div style={{ textAlign: 'center', color: 'hsl(var(--color-text-muted))', padding: '2rem' }}>
                  Loading message history...
                </div>
              ) : messages.length === 0 ? (
                <div style={{ textAlign: 'center', color: 'hsl(var(--color-text-muted))', padding: '2rem' }}>
                  No messages recorded in this conversation.
                </div>
              ) : (
                messages.map(msg => {
                  const isPatient = msg.role === 'user' || msg.role === 'patient';
                  const isStaff = Boolean(msg.metadata?.sent_by_owner || msg.metadata?.from_me || msg.metadata?.from_dashboard);
                  const isOutgoing = !isPatient;
                  const displayContent = formatMessageContent(msg.content);

                  let senderLabel = '🤖 AI Receptionist';
                  if (isPatient) {
                    senderLabel = `👤 ${selectedConv.patient_name || 'Patient'}`;
                  } else if (isStaff) {
                    senderLabel = msg.metadata?.from_me ? '📱 Staff (from WhatsApp)' : '👨‍⚕️ Staff (You)';
                  }

                  return (
                    <div
                      key={msg.id}
                      style={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: isOutgoing ? 'flex-end' : 'flex-start',
                      }}
                    >
                      <div style={{
                        maxWidth: '75%',
                        padding: '0.875rem 1.125rem',
                        borderRadius: isOutgoing ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
                        background: isOutgoing
                          ? isStaff
                            ? 'linear-gradient(135deg, hsl(215 80% 50%) 0%, hsl(235 80% 60%) 100%)'
                            : 'linear-gradient(135deg, hsl(221 83% 58%) 0%, hsl(265 83% 65%) 100%)'
                          : 'hsl(var(--color-surface-2))',
                        border: isOutgoing ? 'none' : '1px solid hsl(var(--color-border))',
                        color: 'white',
                        fontSize: '0.875rem',
                        lineHeight: 1.5,
                        boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                        wordBreak: 'break-word',
                      }}>
                        {displayContent}
                      </div>
                      <div style={{
                        fontSize: '0.65rem',
                        color: 'hsl(var(--color-text-muted))',
                        marginTop: '0.25rem',
                        padding: '0 0.25rem',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.35rem',
                      }}>
                        <span>{senderLabel}</span>
                        <span>•</span>
                        <span>{new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                      </div>
                    </div>
                  );
                })
              )}
              {/* Ref to anchor scroll to bottom */}
              <div ref={messagesEndRef} />
            </div>

            {/* Reply Composer */}
            <div style={{
              padding: '0.875rem 1.5rem',
              borderTop: '1px solid hsl(var(--color-border))',
              background: 'hsl(var(--color-surface))',
              display: 'flex',
              gap: '0.75rem',
              flexShrink: 0,
            }}>
              <input
                className="input"
                style={{ flex: 1 }}
                value={replyText}
                onChange={e => setReplyText(e.target.value)}
                onKeyDown={e => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSendReply();
                  }
                }}
                placeholder="Type a manual WhatsApp reply to patient..."
              />
              <button
                type="button"
                className="btn btn-primary"
                onClick={handleSendReply}
                disabled={actionInProgress || !replyText.trim()}
                style={{ padding: '0.5rem 0.875rem', flexShrink: 0 }}
              >
                Send →
              </button>
            </div>
          </div>
        ) : (
          <div
            className="conv-empty-panel"
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'hsl(var(--color-text-muted))',
              padding: '2rem',
              textAlign: 'center',
            }}
          >
            Select a conversation on the left to view message history
          </div>
        )}
      </div>
    </div>
  );
}
