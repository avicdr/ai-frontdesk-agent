'use client';

// src/app/dashboard/agent-test/page.tsx
// Claude-inspired AI Receptionist Testing Playground — clean conversational canvas, refined typography, and tool inspector

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
      content: "Hello! Welcome to our clinic. I'm your AI front desk assistant. How can I help you today?",
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
      setMessages([...newMessages, { role: 'assistant', content: '⚠️ Error reaching AI engine. Please check your API keys.' }]);
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setMessages([
      {
        role: 'assistant',
        content: "Hello! Welcome to our clinic. I'm your AI front desk assistant. How can I help you today?",
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
            fontSize: '2rem',
            fontWeight: 500,
            fontFamily: 'var(--font-serif)',
            color: '#262522',
            letterSpacing: '-0.02em',
            marginBottom: '0.35rem',
          }}>
            AI Receptionist Test Playground
          </h1>
          <p style={{ color: '#706C65', fontSize: '0.875rem' }}>
            Interact with your clinic&apos;s AI assistant in real-time. Inspect tool calls, pricing queries, and booking workflows.
          </p>
        </div>

        <button
          type="button"
          className="btn btn-secondary btn-sm"
          onClick={handleReset}
          style={{ fontSize: '0.8125rem' }}
        >
          Reset Conversation
        </button>
      </div>

      {/* Preset Test Prompts */}
      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem', overflowX: 'auto', paddingBottom: '0.35rem', alignItems: 'center' }}>
        <span style={{ fontSize: '0.75rem', color: '#706C65', fontWeight: 600, whiteSpace: 'nowrap' }}>
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
              padding: '0.35rem 0.75rem',
              borderRadius: '9999px',
              background: '#FFFFFF',
              border: '1px solid #E7E2DA',
              color: '#262522',
              fontSize: '0.78rem',
              whiteSpace: 'nowrap',
              cursor: 'pointer',
              transition: 'all 0.15s ease',
              boxShadow: '0 1px 2px rgba(38, 37, 34, 0.02)',
            }}
          >
            &ldquo;{prompt}&rdquo;
          </button>
        ))}
      </div>

      {/* Playground Grid (Full width) */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 460px), 1fr))',
        gap: '1.5rem',
        alignItems: 'start',
        width: '100%',
      }}>
        {/* Chat Simulator Pane */}
        <div className="card" style={{ padding: 0, overflow: 'hidden', border: '1px solid #E7E2DA', boxShadow: 'var(--shadow-card)' }}>
          {/* Chat Window Header */}
          <div style={{
            background: '#F4F1EB',
            padding: '1rem 1.25rem',
            borderBottom: '1px solid #E7E2DA',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <div style={{
                width: 32,
                height: 32,
                borderRadius: '8px',
                background: '#D97757',
                color: '#FFFFFF',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '0.9rem',
                fontWeight: 700,
              }}>
                ✦
              </div>
              <div>
                <div style={{ fontWeight: 600, fontSize: '0.9rem', color: '#262522' }}>AI Receptionist</div>
                <div style={{ fontSize: '0.72rem', color: '#487B57', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                  <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#487B57' }} />
                  Live Simulator
                </div>
              </div>
            </div>

            <div style={{ fontSize: '0.75rem', color: '#706C65' }}>
              Simulating: <span style={{ fontFamily: 'var(--font-mono)', color: '#262522' }}>{simulatePhone}</span>
            </div>
          </div>

          {/* Messages Area (Claude Warm Parchment Canvas) */}
          <div style={{
            height: 440,
            overflowY: 'auto',
            padding: '1.5rem',
            background: '#FAF9F5',
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
                    background: isAssistant ? '#FFFFFF' : '#F4F1EB',
                    border: '1px solid #E7E2DA',
                    color: '#262522',
                    fontSize: '0.875rem',
                    lineHeight: 1.6,
                    boxShadow: isAssistant ? '0 1px 3px rgba(38, 37, 34, 0.03)' : 'none',
                  }}>
                    {m.content}
                  </div>
                  <div style={{ fontSize: '0.6875rem', color: '#706C65', marginTop: '0.3rem', padding: '0 0.25rem' }}>
                    {isAssistant ? 'AI Receptionist' : 'Patient'}
                  </div>
                </div>
              );
            })}

            {loading && (
              <div style={{ alignSelf: 'flex-start', background: '#FFFFFF', border: '1px solid #E7E2DA', padding: '0.6rem 1rem', borderRadius: '12px', fontSize: '0.8rem', color: '#706C65' }}>
                <span style={{ color: '#D97757', marginRight: '0.4rem' }}>✦</span>
                Formulating response & checking clinic schedule...
              </div>
            )}
          </div>

          {/* Claude-Style Chat Composer */}
          <div style={{
            padding: '1rem 1.25rem',
            borderTop: '1px solid #E7E2DA',
            background: '#FFFFFF',
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
            <h3 style={{ fontSize: '0.9rem', fontWeight: 600, color: '#262522', marginBottom: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <span style={{ color: '#D97757' }}>✦</span> Model Telemetry
            </h3>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', fontSize: '0.8rem' }}>
              <div style={{ padding: '0.65rem', background: '#F4F1EB', border: '1px solid #E7E2DA', borderRadius: '8px' }}>
                <div style={{ color: '#706C65', fontSize: '0.7rem' }}>Provider</div>
                <div style={{ fontWeight: 600, color: '#262522', marginTop: '0.15rem' }}>{lastProvider ?? 'Gemini 1.5 Flash'}</div>
              </div>

              <div style={{ padding: '0.65rem', background: '#F4F1EB', border: '1px solid #E7E2DA', borderRadius: '8px' }}>
                <div style={{ color: '#706C65', fontSize: '0.7rem' }}>Latency</div>
                <div style={{ fontWeight: 600, color: '#487B57', marginTop: '0.15rem' }}>
                  {lastLatency ? `${lastLatency}ms` : '—'}
                </div>
              </div>

              <div style={{ padding: '0.65rem', background: '#F4F1EB', border: '1px solid #E7E2DA', borderRadius: '8px' }}>
                <div style={{ color: '#706C65', fontSize: '0.7rem' }}>Input Tokens</div>
                <div style={{ fontWeight: 600, color: '#262522', marginTop: '0.15rem' }}>{lastTokens?.input ?? 0}</div>
              </div>

              <div style={{ padding: '0.65rem', background: '#F4F1EB', border: '1px solid #E7E2DA', borderRadius: '8px' }}>
                <div style={{ color: '#706C65', fontSize: '0.7rem' }}>Output Tokens</div>
                <div style={{ fontWeight: 600, color: '#262522', marginTop: '0.15rem' }}>{lastTokens?.output ?? 0}</div>
              </div>
            </div>
          </div>

          {/* Tool Execution Log */}
          <div className="card" style={{ padding: '1.25rem', flex: 1 }}>
            <h3 style={{ fontSize: '0.9rem', fontWeight: 600, color: '#262522', marginBottom: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <span>⚙️</span> Tool Invocations
            </h3>

            {executions.length === 0 ? (
              <div style={{ fontSize: '0.8rem', color: '#706C65', fontStyle: 'italic', padding: '1rem 0' }}>
                No tools triggered yet. Ask about prices, hours, or appointment booking to see tools run!
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', maxHeight: 300, overflowY: 'auto' }}>
                {executions.map((ex, i) => (
                  <div
                    key={i}
                    style={{
                      padding: '0.75rem',
                      borderRadius: '8px',
                      background: '#F4F1EB',
                      border: '1px solid #E7E2DA',
                      fontSize: '0.75rem',
                      fontFamily: 'var(--font-mono)',
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', color: '#D97757', fontWeight: 600, marginBottom: '0.35rem' }}>
                      <span>▶ {ex.tool}</span>
                      <span className="badge badge-success" style={{ fontSize: '0.65rem' }}>SUCCESS</span>
                    </div>
                    <div style={{ color: '#706C65', marginBottom: '0.25rem' }}>
                      Args: {JSON.stringify(ex.args)}
                    </div>
                    <div style={{ color: '#262522', whiteSpace: 'pre-wrap', maxHeight: 100, overflowY: 'auto', background: '#FFFFFF', padding: '0.4rem', borderRadius: '4px', border: '1px solid #E7E2DA' }}>
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
