'use client';

// src/app/dashboard/conversations/page.tsx
// Clinic Conversation Inbox with real-time timeline, human takeover, and WhatsApp reply composer

import React, { useState, useEffect } from 'react';

interface Conversation {
  id: string;
  patient_phone: string;
  status: string;
  owner: string;
  last_message_at: string;
  handoff_reason?: string;
}

interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  created_at: string;
  metadata?: any;
}

export default function ConversationsPage() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConvId, setSelectedConvId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [replyText, setReplyText] = useState('');
  const [actionInProgress, setActionInProgress] = useState(false);

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
        console.error(e);
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
        console.error(e);
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
        setMessages([...messages, json.data.message]);
        setReplyText('');
      }
    } catch (e) {
      console.error(e);
    } finally {
      setActionInProgress(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 6rem)' }}>
      {/* Page Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
        <div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 800, letterSpacing: '-0.02em' }}>
            💬 Patient Conversations & Live Inbox
          </h1>
          <p style={{ color: 'hsl(var(--color-text-muted))', fontSize: '0.85rem' }}>
            Monitor real-time WhatsApp dialogues, take over chats, or let AI handle reception automatically.
          </p>
        </div>
      </div>

      {/* Main Container */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: '340px 1fr',
        gap: '1rem',
        flex: 1,
        minHeight: 0,
        background: 'hsl(var(--color-surface))',
        border: '1px solid hsl(var(--color-border))',
        borderRadius: '16px',
        overflow: 'hidden',
      }}>
        {/* Left Column: Conversation List */}
        <div style={{
          borderRight: '1px solid hsl(var(--color-border))',
          display: 'flex',
          flexDirection: 'column',
          background: 'hsl(var(--color-background) / 0.5)',
        }}>
          <div style={{ padding: '1rem', borderBottom: '1px solid hsl(var(--color-border))' }}>
            <input
              className="input"
              style={{ fontSize: '0.8rem', padding: '0.5rem 0.75rem' }}
              placeholder="Search by phone number..."
            />
          </div>

          <div style={{ overflowY: 'auto', flex: 1 }}>
            {loading ? (
              <div style={{ padding: '2rem', textAlign: 'center', color: 'hsl(var(--color-text-muted))', fontSize: '0.85rem' }}>
                Loading conversations...
              </div>
            ) : conversations.length === 0 ? (
              <div style={{ padding: '2rem', textAlign: 'center', color: 'hsl(var(--color-text-muted))', fontSize: '0.85rem' }}>
                No active conversations yet. Messages sent by patients to your WhatsApp number will appear here!
              </div>
            ) : (
              conversations.map(conv => {
                const isSelected = conv.id === selectedConvId;
                const isHandoff = conv.owner === 'human' || conv.status === 'handed_off';
                return (
                  <div
                    key={conv.id}
                    onClick={() => setSelectedConvId(conv.id)}
                    style={{
                      padding: '1rem',
                      borderBottom: '1px solid hsl(var(--color-border))',
                      background: isSelected ? 'hsl(var(--color-primary) / 0.1)' : 'transparent',
                      cursor: 'pointer',
                      borderLeft: isSelected ? '3px solid hsl(var(--color-primary))' : '3px solid transparent',
                      transition: 'background 0.15s ease',
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.25rem' }}>
                      <span style={{ fontWeight: 700, fontSize: '0.875rem' }}>{conv.patient_phone}</span>
                      <span style={{ fontSize: '0.7rem', color: 'hsl(var(--color-text-muted))' }}>
                        {new Date(conv.last_message_at || Date.now()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
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
          <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
            {/* Thread Header */}
            <div style={{
              padding: '1rem 1.5rem',
              borderBottom: '1px solid hsl(var(--color-border))',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              background: 'hsl(var(--color-surface))',
            }}>
              <div>
                <div style={{ fontWeight: 800, fontSize: '1rem' }}>{selectedConv.patient_phone}</div>
                <div style={{ fontSize: '0.75rem', color: 'hsl(var(--color-text-muted))' }}>
                  Channel: WhatsApp Cloud API • Mode:{' '}
                  <span style={{ color: selectedConv.owner === 'human' ? 'hsl(38 92% 50%)' : 'hsl(142 71% 45%)', fontWeight: 600 }}>
                    {selectedConv.owner === 'human' ? 'Manual Staff Intervention' : 'Autonomous AI Receptionist'}
                  </span>
                </div>
              </div>

              {/* Takeover Toggle Button */}
              <button
                type="button"
                className={`btn ${selectedConv.owner === 'human' ? 'btn-primary' : 'btn-secondary'}`}
                onClick={handleToggleTakeover}
                disabled={actionInProgress}
                style={{ fontSize: '0.8rem', padding: '0.5rem 1rem' }}
              >
                {selectedConv.owner === 'human' ? '🤖 Resume AI Receptionist' : '✋ Take Over (Pause AI)'}
              </button>
            </div>

            {/* Message History Bubble Feed */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
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
                  const isUser = msg.role === 'user';
                  return (
                    <div
                      key={msg.id}
                      style={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: isUser ? 'flex-start' : 'flex-end',
                      }}
                    >
                      <div style={{
                        maxWidth: '75%',
                        padding: '0.875rem 1.125rem',
                        borderRadius: isUser ? '16px 16px 16px 4px' : '16px 16px 4px 16px',
                        background: isUser ? 'hsl(var(--color-surface-hover))' : 'linear-gradient(135deg, hsl(221 83% 58%) 0%, hsl(265 83% 65%) 100%)',
                        color: 'white',
                        fontSize: '0.875rem',
                        lineHeight: 1.5,
                        boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                      }}>
                        {msg.content}
                      </div>
                      <div style={{ fontSize: '0.65rem', color: 'hsl(var(--color-text-muted))', marginTop: '0.25rem', padding: '0 0.25rem' }}>
                        {isUser ? 'Patient' : 'AI Receptionist'} • {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Reply Composer */}
            <div style={{
              padding: '1rem 1.5rem',
              borderTop: '1px solid hsl(var(--color-border))',
              background: 'hsl(var(--color-surface))',
              display: 'flex',
              gap: '0.75rem',
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
              >
                Send WhatsApp →
              </button>
            </div>
          </div>
        ) : (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'hsl(var(--color-text-muted))' }}>
            Select a conversation on the left to view message history
          </div>
        )}
      </div>
    </div>
  );
}
