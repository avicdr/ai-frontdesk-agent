'use client';

// src/app/dashboard/agent-test/page.tsx
// Cinematic Obsidian × Phoenix Ember AI Receptionist Testing Playground

import React, { useState } from 'react';

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

interface ToolExecution {
  tool: string;
  args: any;
  result: any;
}

export default function AgentTestPage() {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      role: 'assistant',
      content: "Hello! Welcome to our clinic. I'm your AI front desk assistant. How can I assist you with your appointment or questions today?",
    },
  ]);
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(false);
  const [simulatePhone, setSimulatePhone] = useState('+919876543210');

  // Inspector stats
  const [lastLatency, setLastLatency] = useState<number | null>(null);
  const [lastProvider, setLastProvider] = useState<string | null>(null);
  const [lastModel, setLastModel] = useState<string | null>(null);
  const [lastTokens, setLastTokens] = useState<{ input: number; output: number } | null>(null);
  const [executions, setExecutions] = useState<ToolExecution[]>([]);

  const handleSendMessage = async (userPrompt?: string) => {
    const textToSend = userPrompt || inputText;
    if (!textToSend.trim() || loading) return;

    const newMessages: ChatMessage[] = [...messages, { role: 'user', content: textToSend }];
    setMessages(newMessages);
    setInputText('');
    setLoading(true);

    try {
      const res = await fetch('/api/v1/chat/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: newMessages,
          simulatePhone,
        }),
      });

      const json = await res.json();
      if (json.data) {
        setMessages([...newMessages, { role: 'assistant', content: json.data.reply || '...' }]);
        setLastLatency(json.data.latencyMs);
        setLastProvider(json.data.provider);
        setLastModel(json.data.model);
        setLastTokens({ input: json.data.inputTokens, output: json.data.outputTokens });
        if (json.data.executionLog) {
          setExecutions(json.data.executionLog);
        }
      } else {
        const errorMsg = json.error?.message || 'Received unexpected response from server.';
        setMessages([...newMessages, { role: 'assistant', content: `⚠️ ${errorMsg}` }]);
      }
    } catch (e) {
      console.error(e);
      setMessages([...newMessages, { role: 'assistant', content: '⚠️ Error reaching AI engine. Please verify configuration.' }]);
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setMessages([
      {
        role: 'assistant',
        content: "Hello! Welcome to our clinic. I'm your AI front desk assistant. How can I assist you with your appointment or questions today?",
      },
    ]);
    setExecutions([]);
    setLastLatency(null);
  };

  return (
    <div style={{ width: '100%', maxWidth: '100%' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.75rem' }}>
        <div>
          <h1 style={{
            fontSize: '2.1rem',
            fontWeight: 500,
            fontFamily: 'var(--font-display)',
            color: '#F3F0E8',
            letterSpacing: '-0.025em',
            marginBottom: '0.35rem',
          }}>
            AI Receptionist Test Playground
          </h1>
          <p style={{ color: '#9E9B93', fontSize: '0.875rem' }}>
            Simulate patient conversations in real-time. Inspect tool calls, schedule conflict checks, and Gemini telemetry.
          </p>
        </div>

        <button
          type="button"
          className="btn btn-secondary btn-sm"
          onClick={handleReset}
          style={{ fontSize: '0.8125rem' }}
        >
          Reset Session
        </button>
      </div>

      {/* Suggested Queries Chips */}
      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem', overflowX: 'auto', paddingBottom: '0.35rem', alignItems: 'center' }}>
        <span style={{ fontSize: '0.75rem', color: '#9E9B93', fontWeight: 600, whiteSpace: 'nowrap' }}>
          Suggested queries:
        </span>
        {[
          'What are your charges for teeth cleaning?',
          'What are your clinic hours on Wednesday?',
          'Can I book a consultation tomorrow at 10 AM?',
          'I have severe tooth pain, do you take emergencies?',
          'Do you do root canal treatment?',
          'I want to speak to a doctor directly',
        ].map((prompt, i) => (
          <button
            key={i}
            type="button"
            onClick={() => handleSendMessage(prompt)}
            disabled={loading}
            style={{
              padding: '0.35rem 0.8rem',
              borderRadius: '9999px',
              background: '#1C1916',
              border: '1px solid rgba(243, 240, 232, 0.1)',
              color: '#D0CBC1',
              fontSize: '0.78rem',
              whiteSpace: 'nowrap',
              cursor: 'pointer',
              transition: 'all 0.15s ease',
            }}
            onMouseEnter={e => {
              e.currentTarget.style.borderColor = 'rgba(232, 75, 44, 0.4)';
              e.currentTarget.style.color = '#F3F0E8';
            }}
            onMouseLeave={e => {
              e.currentTarget.style.borderColor = 'rgba(243, 240, 232, 0.1)';
              e.currentTarget.style.color = '#D0CBC1';
            }}
          >
            &ldquo;{prompt}&rdquo;
          </button>
        ))}
      </div>

      {/* Playground Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 460px), 1fr))',
        gap: '1.5rem',
        alignItems: 'start',
        width: '100%',
      }}>
        {/* Chat Simulator Pane */}
        <div className="card" style={{ padding: 0, overflow: 'hidden', border: '1px solid rgba(243, 240, 232, 0.08)' }}>
          {/* Chat Window Header */}
          <div style={{
            background: '#1C1916',
            padding: '1rem 1.25rem',
            borderBottom: '1px solid rgba(243, 240, 232, 0.08)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <div style={{
                width: 32,
                height: 32,
                borderRadius: '8px',
                background: 'linear-gradient(135deg, #E84B2C, #C86938)',
                color: '#FFFFFF',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '0.9rem',
                fontWeight: 700,
                boxShadow: '0 0 12px rgba(232, 75, 44, 0.35)',
              }}>
                ✦
              </div>
              <div>
                <div style={{ fontWeight: 600, fontSize: '0.9rem', color: '#F3F0E8' }}>AI Receptionist</div>
                <div style={{ fontSize: '0.72rem', color: '#63C7A2', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                  <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#63C7A2', display: 'inline-block', boxShadow: '0 0 8px rgba(99, 199, 162, 0.6)' }} />
                  Live Simulator
                </div>
              </div>
            </div>

            <div style={{ fontSize: '0.75rem', color: '#9E9B93' }}>
              Simulating: <span style={{ fontFamily: 'var(--font-mono)', color: '#F3F0E8' }}>{simulatePhone}</span>
            </div>
          </div>

          {/* Messages Area */}
          <div style={{
            height: 440,
            overflowY: 'auto',
            padding: '1.5rem',
            background: 'var(--color-obsidian)',
            display: 'flex',
            flexDirection: 'column',
            gap: '1.25rem',
          }}>
            {messages.map((m, idx) => {
              const isAssistant = m.role === 'assistant';
              return (
                <div
                  key={idx}
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: isAssistant ? 'flex-start' : 'flex-end',
                  }}
                >
                  <div style={{
                    maxWidth: '85%',
                    padding: '0.85rem 1.15rem',
                    borderRadius: isAssistant ? '14px 14px 14px 4px' : '14px 14px 4px 14px',
                    background: isAssistant ? 'var(--color-surface-elevated)' : 'linear-gradient(135deg, #E84B2C, #C86938)',
                    border: isAssistant ? '1px solid var(--color-border-standard)' : '1px solid rgba(243, 240, 232, 0.15)',
                    color: isAssistant ? 'var(--color-text-primary)' : '#FFFFFF',
                    fontSize: '0.875rem',
                    lineHeight: 1.6,
                    boxShadow: isAssistant ? 'var(--shadow-card)' : '0 2px 10px rgba(232, 75, 44, 0.3)',
                  }}>
                    {m.content}
                  </div>
                  <div style={{ fontSize: '0.6875rem', color: 'var(--color-text-muted)', marginTop: '0.3rem', padding: '0 0.25rem' }}>
                    {isAssistant ? 'AI Receptionist' : 'Patient'}
                  </div>
                </div>
              );
            })}

            {loading && (
              <div style={{ alignSelf: 'flex-start', background: 'var(--color-surface-elevated)', border: '1px solid var(--color-border-standard)', padding: '0.65rem 1rem', borderRadius: '12px', fontSize: '0.8rem', color: 'var(--color-text-secondary)', display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                <span style={{ color: '#E87A38' }}>✦</span>
                Formulating response & inspecting clinic schedule...
              </div>
            )}
          </div>

          {/* Chat Composer */}
          <div style={{
            padding: '1rem 1.25rem',
            borderTop: '1px solid var(--color-border-subtle)',
            background: 'var(--color-surface-elevated)',
            display: 'flex',
            gap: '0.65rem',
          }}>
            <input
              className="input"
              style={{ flex: 1 }}
              value={inputText}
              onChange={e => setInputText(e.target.value)}
              onKeyDown={e => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSendMessage();
                }
              }}
              placeholder="Ask a question as a prospective patient..."
              disabled={loading}
            />
            <button
              type="button"
              className="btn btn-primary"
              onClick={() => handleSendMessage()}
              disabled={loading || !inputText.trim()}
            >
              Send
            </button>
          </div>
        </div>

        {/* AI Engine & Tool Execution Inspector Panel */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {/* Telemetry Card */}
          <div className="card" style={{ padding: '1.25rem' }}>
            <h3 style={{ fontSize: '0.9rem', fontWeight: 600, color: '#F3F0E8', marginBottom: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
              <span style={{ color: '#E87A38' }}>✦</span> Model Telemetry
            </h3>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', fontSize: '0.8rem' }}>
              <div style={{ padding: '0.75rem', background: '#1C1916', border: '1px solid rgba(243, 240, 232, 0.08)', borderRadius: '10px' }}>
                <div style={{ color: '#9E9B93', fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Provider</div>
                <div style={{ fontWeight: 600, color: '#F3F0E8', marginTop: '0.2rem' }}>{lastProvider ?? 'Gemini 1.5 Flash'}</div>
              </div>

              <div style={{ padding: '0.75rem', background: '#1C1916', border: '1px solid rgba(243, 240, 232, 0.08)', borderRadius: '10px' }}>
                <div style={{ color: '#9E9B93', fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Latency</div>
                <div style={{ fontWeight: 600, color: '#63C7A2', marginTop: '0.2rem' }}>
                  {lastLatency ? `${lastLatency}ms` : '—'}
                </div>
              </div>

              <div style={{ padding: '0.75rem', background: '#1C1916', border: '1px solid rgba(243, 240, 232, 0.08)', borderRadius: '10px' }}>
                <div style={{ color: '#9E9B93', fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Input Tokens</div>
                <div style={{ fontWeight: 600, color: '#F3F0E8', marginTop: '0.2rem', fontFamily: 'var(--font-mono)' }}>{lastTokens?.input ?? 0}</div>
              </div>

              <div style={{ padding: '0.75rem', background: '#1C1916', border: '1px solid rgba(243, 240, 232, 0.08)', borderRadius: '10px' }}>
                <div style={{ color: '#9E9B93', fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Output Tokens</div>
                <div style={{ fontWeight: 600, color: '#F3F0E8', marginTop: '0.2rem', fontFamily: 'var(--font-mono)' }}>{lastTokens?.output ?? 0}</div>
              </div>
            </div>
          </div>

          {/* Tool Execution Log */}
          <div className="card" style={{ padding: '1.25rem', flex: 1 }}>
            <h3 style={{ fontSize: '0.9rem', fontWeight: 600, color: '#F3F0E8', marginBottom: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
              <span>⚙️</span> Tool Invocations
            </h3>

            {executions.length === 0 ? (
              <div style={{ fontSize: '0.8rem', color: '#9E9B93', fontStyle: 'italic', padding: '1rem 0' }}>
                No tools triggered yet. Ask about prices, working hours, or schedule booking to view executions.
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', maxHeight: 300, overflowY: 'auto' }}>
                {executions.map((ex, i) => (
                  <div
                    key={i}
                    style={{
                      padding: '0.75rem',
                      borderRadius: '8px',
                      background: 'var(--color-surface-secondary)',
                      border: '1px solid var(--color-border-subtle)',
                      fontSize: '0.75rem',
                      fontFamily: 'var(--font-mono)',
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', color: '#E87A38', fontWeight: 600, marginBottom: '0.35rem' }}>
                      <span>▶ {ex.tool}</span>
                      <span className="badge badge-success" style={{ fontSize: '0.65rem' }}>SUCCESS</span>
                    </div>
                    <div style={{ color: 'var(--color-text-muted)', marginBottom: '0.25rem' }}>
                      Args: {JSON.stringify(ex.args)}
                    </div>
                    <div style={{ color: 'var(--color-text-primary)', whiteSpace: 'pre-wrap', maxHeight: 100, overflowY: 'auto', background: 'var(--color-surface-elevated)', padding: '0.45rem', borderRadius: '4px', border: '1px solid var(--color-border-subtle)' }}>
                      {JSON.stringify(ex.result, null, 2)}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
