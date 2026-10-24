'use client';

// src/app/dashboard/conversations/page.tsx
// Claude-inspired Clinic Conversation Inbox with warm paper workspace, real-time timeline, and human takeover

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

  if (clean.length >= 14 && !clean.startsWith('91')) {
    return `WA ID: ${clean.slice(0, 4)}••••${clean.slice(-4)}`;
  }

  if (clean.startsWith('91') && clean.length === 12) {
    return `+91 ${clean.slice(2, 7)}-${clean.slice(7)}`;
  }

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
      const cleanJson = trimmed.replace(/^```json\s*/i, '').replace(/^```\s*/, '').replace(/```$/, '').trim();
      const parsed = JSON.parse(cleanJson);
      if (parsed.message) return parsed.message;
      if (parsed.reply) return parsed.reply;
      if (parsed.response) return parsed.response;
      if (parsed.text) return parsed.text;
    } catch {
      // Fallback
    }
  }

  return content;
}

export default function ConversationsPage() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConvId, setSelectedConvId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [actionInProgress, setActionInProgress] = useState(false);
  const [replyText, setReplyText] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom of conversation feed on new messages
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Load conversation threads
  const fetchConversations = async () => {
    try {
      const res = await fetch('/api/v1/conversations');
      const json = await res.json();
      if (json.data?.conversations) {
        setConversations(json.data.conversations);
        if (!selectedConvId && json.data.conversations.length > 0) {
          setSelectedConvId(json.data.conversations[0].id);
        }
      }
    } catch (e) {
      console.error('Failed to load conversations:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchConversations();
    const interval = setInterval(fetchConversations, 8000);
    return () => clearInterval(interval);
  }, []);

  // Load message timeline for selected conversation
  useEffect(() => {
    if (!selectedConvId) {
      setMessages([]);
      return;
    }

    let isMounted = true;
    const fetchTimeline = async () => {
      setLoadingMessages(true);
      try {
        const res = await fetch(`/api/v1/conversations/${selectedConvId}`);
        const json = await res.json();
        if (isMounted && json.data?.messages) {
          setMessages(json.data.messages);
        }
      } catch (e) {
        console.error('Failed to load conversation timeline:', e);
      } finally {
        if (isMounted) setLoadingMessages(false);
      }
    };

    fetchTimeline();
    const interval = setInterval(fetchTimeline, 5000);

    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [selectedConvId]);

  const selectedConv = conversations.find(c => c.id === selectedConvId);

  // Toggle Human Takeover / Return to AI
  const handleToggleTakeover = async () => {
    if (!selectedConvId || !selectedConv) return;
    setActionInProgress(true);
    const newOwner = selectedConv.owner === 'human' ? 'ai' : 'human';
    const newStatus = newOwner === 'human' ? 'handed_off' : 'active';

    try {
      const res = await fetch(`/api/v1/conversations/${selectedConvId}/takeover`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          owner: newOwner,
          status: newStatus,
          reason: newOwner === 'human' ? 'Doctor took over live chat via dashboard' : undefined,
        }),
      });

      if (res.ok) {
        setConversations(prev =>
          prev.map(c => (c.id === selectedConvId ? { ...c, owner: newOwner, status: newStatus } : c))
        );
      }
    } catch (e) {
      console.error(e);
    } finally {
      setActionInProgress(false);
    }
  };

  // Send Manual Reply (Direct to Patient WhatsApp via Baileys)
  const handleSendReply = async () => {
    if (!selectedConvId || !replyText.trim()) return;
    setActionInProgress(true);

    try {
      const res = await fetch(`/api/v1/conversations/${selectedConvId}/reply`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: replyText.trim() }),
      });

      if (res.ok) {
        const optimisticMsg: Message = {
          id: `opt_${Date.now()}`,
          role: 'assistant',
          content: replyText.trim(),
          created_at: new Date().toISOString(),
          metadata: { from_dashboard: true },
        };
        setMessages(prev => [...prev, optimisticMsg]);
        setReplyText('');
      }
    } catch (e) {
      console.error(e);
    } finally {
      setActionInProgress(false);
    }
  };

  // Delete single conversation thread
  const handleDeleteSingleConversation = async (convId: string) => {
    if (!confirm('Are you sure you want to delete this conversation thread?')) {
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

  // Filter conversations by search term
  const filteredConversations = conversations.filter(c => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return true;
    const phone = (c.patient_phone || '').toLowerCase();
    const name = (c.patient_name || '').toLowerCase();
    return phone.includes(q) || name.includes(q);
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 6.5rem)', minHeight: 480, overflow: 'hidden', width: '100%' }}>
      {/* Page Header (Claude Warm Serif) */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexShrink: 0, flexWrap: 'wrap', gap: '0.75rem' }}>
        <div>
          <h1 style={{ fontSize: '1.85rem', fontWeight: 500, fontFamily: 'var(--font-serif)', color: '#262522', letterSpacing: '-0.02em', margin: 0 }}>
            Patient Conversations
          </h1>
          <p style={{ color: '#706C65', fontSize: '0.85rem', margin: '0.2rem 0 0 0' }}>
            Monitor WhatsApp dialogues, review patient requests, take over chats, or allow AI to manage reception.
          </p>
        </div>

        {conversations.length > 0 && (
          <button
            type="button"
            onClick={handleClearAllConversations}
            disabled={isDeleting}
            className="btn btn-secondary btn-sm"
            style={{
              color: '#C44E45',
              fontSize: '0.75rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.35rem',
            }}
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
          background: '#FFFFFF',
          border: '1px solid #E7E2DA',
          borderRadius: '14px',
          overflow: 'hidden',
          position: 'relative',
          boxShadow: 'var(--shadow-card)',
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
            borderRight: '1px solid #E7E2DA',
            display: 'flex',
            flexDirection: 'column',
            height: '100%',
            minHeight: 0,
            background: '#F4F1EB',
          }}
        >
          {/* Search bar */}
          <div style={{ padding: '0.85rem 1rem', borderBottom: '1px solid #E7E2DA', flexShrink: 0 }}>
            <input
              className="input"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              style={{ fontSize: '0.8125rem', padding: '0.45rem 0.75rem', width: '100%', background: '#FFFFFF' }}
              placeholder="Search by name or number..."
            />
          </div>

          {/* Conversation List Scroll Area */}
          <div style={{ overflowY: 'auto', flex: 1, minHeight: 0 }}>
            {loading ? (
              <div style={{ padding: '2rem', textAlign: 'center', color: '#706C65', fontSize: '0.85rem' }}>
                Loading conversations...
              </div>
            ) : filteredConversations.length === 0 ? (
              <div style={{ padding: '2rem', textAlign: 'center', color: '#706C65', fontSize: '0.85rem' }}>
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
                      padding: '0.85rem 1rem',
                      borderBottom: '1px solid #E7E2DA',
                      background: isSelected ? '#F8E8DE' : 'transparent',
                      cursor: 'pointer',
                      borderLeft: isSelected ? '3px solid #D97757' : '3px solid transparent',
                      transition: 'background 0.15s ease',
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <div style={{ minWidth: 0, flex: 1, marginRight: '0.5rem' }}>
                        <div style={{
                          fontWeight: 600,
                          fontSize: '0.875rem',
                          color: '#262522',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                        }}>
                          {title}
                        </div>
                        {conv.patient_name && (
                          <div style={{ fontSize: '0.75rem', color: '#706C65', marginTop: '0.1rem' }}>
                            {formattedNum}
                          </div>
                        )}
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                        <span style={{ fontSize: '0.7rem', color: '#706C65', whiteSpace: 'nowrap' }}>
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
                            color: '#706C65',
                            cursor: 'pointer',
                            padding: '2px 4px',
                            borderRadius: '4px',
                            fontSize: '0.75rem',
                            opacity: 0.6,
                            transition: 'opacity 0.15s, color 0.15s',
                          }}
                          title="Delete this conversation"
                        >
                          🗑️
                        </button>
                      </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginTop: '0.35rem' }}>
                      <span className={`badge ${isHandoff ? 'badge-warning' : 'badge-success'}`} style={{ fontSize: '0.65rem' }}>
                        {isHandoff ? 'Staff Control' : 'AI Active'}
                      </span>
                      {conv.handoff_reason && (
                        <span style={{ fontSize: '0.7rem', color: '#706C65', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
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
              background: '#FAF9F5',
            }}
          >
            {/* Thread Header */}
            <div style={{
              padding: '0.85rem 1.25rem',
              borderBottom: '1px solid #E7E2DA',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              background: '#FFFFFF',
              flexWrap: 'wrap',
              gap: '0.5rem',
              flexShrink: 0,
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', minWidth: 0 }}>
                {/* Mobile back button */}
                <button
                  type="button"
                  onClick={() => setSelectedConvId(null)}
                  className="show-on-mobile btn btn-secondary btn-sm"
                  style={{
                    padding: '0.3rem 0.55rem',
                    fontSize: '0.8rem',
                  }}
                  title="Back to contacts list"
                >
                  ←
                </button>

                <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', minWidth: 0 }}>
                  <div style={{
                    width: 32,
                    height: 32,
                    borderRadius: '50%',
                    background: '#F4F1EB',
                    border: '1px solid #E7E2DA',
                    color: '#262522',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '0.85rem',
                    fontWeight: 600,
                    flexShrink: 0,
                  }}>
                    {(selectedConv.patient_name?.[0] || 'P').toUpperCase()}
                  </div>
                  <div style={{ minWidth: 0 }}>
                    <div style={{
                      fontWeight: 600,
                      fontSize: '0.95rem',
                      color: '#262522',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    }}>
                      {selectedConv.patient_name || formatContactNumber(selectedConv.patient_phone)}
                    </div>
                    {selectedConv.patient_name && (
                      <div style={{ fontSize: '0.72rem', color: '#706C65' }}>
                        {formatContactNumber(selectedConv.patient_phone)}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Actions Button Group */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  onClick={() => handleDeleteSingleConversation(selectedConv.id)}
                  disabled={isDeleting || actionInProgress}
                  style={{
                    fontSize: '0.75rem',
                    color: '#C44E45',
                  }}
                  title="Delete this conversation thread"
                >
                  Delete
                </button>

                <button
                  type="button"
                  className={`btn ${selectedConv.owner === 'human' ? 'btn-primary' : 'btn-secondary'} btn-sm`}
                  onClick={handleToggleTakeover}
                  disabled={actionInProgress}
                  style={{ fontSize: '0.75rem' }}
                >
                  {selectedConv.owner === 'human' ? '🤖 Resume AI' : '✋ Take Over'}
                </button>
              </div>
            </div>

            {/* Message History Bubble Feed (Scrollable Claude Parchment Canvas) */}
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
                <div style={{ textAlign: 'center', color: '#706C65', padding: '2rem' }}>
                  Loading message history...
                </div>
              ) : messages.length === 0 ? (
                <div style={{ textAlign: 'center', color: '#706C65', padding: '2rem' }}>
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
                    senderLabel = msg.metadata?.from_me ? '📱 Staff (WhatsApp)' : '👨‍⚕️ Staff';
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
                        padding: '0.85rem 1.15rem',
                        borderRadius: isOutgoing ? '14px 14px 4px 14px' : '14px 14px 14px 4px',
                        background: isOutgoing ? (isStaff ? '#F8E8DE' : '#FFFFFF') : '#F4F1EB',
                        border: `1px solid ${isOutgoing ? (isStaff ? '#F0D5C7' : '#E7E2DA') : '#E7E2DA'}`,
                        color: '#262522',
                        fontSize: '0.875rem',
                        lineHeight: 1.6,
                        boxShadow: '0 1px 2px rgba(38, 37, 34, 0.03)',
                        wordBreak: 'break-word',
                      }}>
                        {displayContent}
                      </div>
                      <div style={{
                        fontSize: '0.6875rem',
                        color: '#706C65',
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
              <div ref={messagesEndRef} />
            </div>

            {/* Reply Composer */}
            <div style={{
              padding: '0.85rem 1.25rem',
              borderTop: '1px solid #E7E2DA',
              background: '#FFFFFF',
              display: 'flex',
              gap: '0.65rem',
              flexShrink: 0,
            }}>
              <input
                className="input"
                style={{ flex: 1, background: '#FAF9F5' }}
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
                style={{ flexShrink: 0 }}
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
              color: '#706C65',
              padding: '2rem',
              textAlign: 'center',
              background: '#FAF9F5',
            }}
          >
            Select a conversation on the left to view message history
          </div>
        )}
      </div>
    </div>
  );
}
