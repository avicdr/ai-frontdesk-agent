'use client';

// src/app/dashboard/agent-test/page.tsx
// Interactive AI Receptionist Testing Playground — test-drive the AI agent before going live on WhatsApp

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
    <div>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
        <div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 800, letterSpacing: '-0.02em' }}>
            🧪 AI Receptionist Test Playground
          </h1>
          <p style={{ color: 'hsl(var(--color-text-muted))', fontSize: '0.875rem' }}>
            Interact with your clinic's AI in real-time. Inspect tool calls, pricing retrieval, and booking logic.
          </p>
        </div>

        <button
          type="button"
          className="btn btn-secondary"
          onClick={handleReset}
          style={{ fontSize: '0.8rem' }}
        >
          🔄 Reset Conversation
        </button>
      </div>

      {/* Preset Test Prompts */}
      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.25rem', overflowX: 'auto', paddingBottom: '0.25rem' }}>
        <span style={{ fontSize: '0.75rem', color: 'hsl(var(--color-text-muted))', alignSelf: 'center', fontWeight: 600 }}>
          Try quick queries:
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
              background: 'hsl(var(--color-surface))',
              border: '1px solid hsl(var(--color-border))',
              color: 'hsl(var(--color-text-muted))',
              fontSize: '0.75rem',
              whiteSpace: 'nowrap',
              cursor: 'pointer',
              transition: 'border-color 0.15s ease',
            }}
          >
            "{prompt}"
          </button>
        ))}
      </div>

      {/* Playground Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '1.5rem', alignItems: 'start' }}>
        {/* WhatsApp Mobile Chat Simulator */}
        <div className="card" style={{ padding: 0, overflow: 'hidden', border: '1px solid hsl(var(--color-border))' }}>
          {/* Chat Window Header */}
          <div style={{
            background: 'hsl(142 35% 10%)',
            padding: '0.875rem 1.25rem',
            borderBottom: '1px solid hsl(142 30% 18%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <div style={{
                width: 36,
                height: 36,
                borderRadius: '50%',
                background: 'hsl(142 71% 45%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '1rem',
              }}>
                🤖
              </div>
              <div>
                <div style={{ fontWeight: 700, fontSize: '0.9rem', color: 'white' }}>Clinic AI Receptionist</div>
                <div style={{ fontSize: '0.7rem', color: 'hsl(142 70% 65%)' }}>● Live WhatsApp Simulator</div>
              </div>
            </div>

            <div style={{ fontSize: '0.75rem', color: 'hsl(var(--color-text-muted))' }}>
              Patient: <span style={{ fontFamily: 'monospace', color: 'white' }}>{simulatePhone}</span>
            </div>
          </div>

          {/* Messages Area */}
          <div style={{
            height: 420,
            overflowY: 'auto',
            padding: '1.25rem',
            background: 'hsl(var(--color-background))',
            display: 'flex',
            flexDirection: 'column',
            gap: '1rem',
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
                    maxWidth: '80%',
                    padding: '0.75rem 1rem',
                    borderRadius: isAssistant ? '14px 14px 14px 2px' : '14px 14px 2px 14px',
                    background: isAssistant ? 'hsl(142 30% 12%)' : 'hsl(var(--color-primary))',
                    border: isAssistant ? '1px solid hsl(142 30% 22%)' : 'none',
                    color: 'white',
                    fontSize: '0.85rem',
                    lineHeight: 1.5,
                  }}>
                    {m.content}
                  </div>
                  <div style={{ fontSize: '0.65rem', color: 'hsl(var(--color-text-muted))', marginTop: '0.2rem' }}>
                    {isAssistant ? 'AI Receptionist' : 'Patient'}
                  </div>
                </div>
              );
            })}

            {loading && (
              <div style={{ alignSelf: 'flex-start', background: 'hsl(142 30% 12%)', padding: '0.5rem 0.85rem', borderRadius: '12px', fontSize: '0.75rem', color: 'hsl(142 70% 65%)' }}>
                AI is thinking & executing tools...
              </div>
            )}
          </div>

          {/* Chat Input */}
          <div style={{
            padding: '0.875rem 1.25rem',
            borderTop: '1px solid hsl(var(--color-border))',
            background: 'hsl(var(--color-surface))',
            display: 'flex',
            gap: '0.5rem',
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
              placeholder="Type message as patient..."
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
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {/* Telemetry Card */}
          <div className="card" style={{ padding: '1.25rem' }}>
            <h3 style={{ fontSize: '0.9rem', fontWeight: 700, marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              ⚡ Model Telemetry
            </h3>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', fontSize: '0.8rem' }}>
              <div style={{ padding: '0.5rem', background: 'hsl(var(--color-surface-hover))', borderRadius: '8px' }}>
                <div style={{ color: 'hsl(var(--color-text-muted))', fontSize: '0.7rem' }}>Provider</div>
                <div style={{ fontWeight: 700 }}>{lastProvider ?? 'Gemini 1.5 Flash'}</div>
              </div>

              <div style={{ padding: '0.5rem', background: 'hsl(var(--color-surface-hover))', borderRadius: '8px' }}>
                <div style={{ color: 'hsl(var(--color-text-muted))', fontSize: '0.7rem' }}>Latency</div>
                <div style={{ fontWeight: 700, color: 'hsl(142 71% 45%)' }}>
                  {lastLatency ? `${lastLatency}ms` : '—'}
                </div>
              </div>

              <div style={{ padding: '0.5rem', background: 'hsl(var(--color-surface-hover))', borderRadius: '8px' }}>
                <div style={{ color: 'hsl(var(--color-text-muted))', fontSize: '0.7rem' }}>Input Tokens</div>
                <div style={{ fontWeight: 700 }}>{lastTokens?.input ?? 0}</div>
              </div>

              <div style={{ padding: '0.5rem', background: 'hsl(var(--color-surface-hover))', borderRadius: '8px' }}>
                <div style={{ color: 'hsl(var(--color-text-muted))', fontSize: '0.7rem' }}>Output Tokens</div>
                <div style={{ fontWeight: 700 }}>{lastTokens?.output ?? 0}</div>
              </div>
            </div>
          </div>

          {/* Tool Execution Log */}
          <div className="card" style={{ padding: '1.25rem', flex: 1 }}>
            <h3 style={{ fontSize: '0.9rem', fontWeight: 700, marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              🔧 Tool Invocations
            </h3>

            {executions.length === 0 ? (
              <div style={{ fontSize: '0.75rem', color: 'hsl(var(--color-text-muted))', fontStyle: 'italic', padding: '1rem 0' }}>
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
                      background: 'hsl(var(--color-background))',
                      border: '1px solid hsl(var(--color-border))',
                      fontSize: '0.75rem',
                      fontFamily: 'monospace',
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', color: 'hsl(var(--color-primary))', fontWeight: 700, marginBottom: '0.35rem' }}>
                      <span>▶ {ex.tool}</span>
                      <span style={{ color: 'hsl(142 71% 45%)' }}>SUCCESS</span>
                    </div>
                    <div style={{ color: 'hsl(var(--color-text-muted))', marginBottom: '0.25rem' }}>
                      Args: {JSON.stringify(ex.args)}
                    </div>
                    <div style={{ color: 'white', whiteSpace: 'pre-wrap', maxHeight: 100, overflowY: 'auto' }}>
                      Result: {JSON.stringify(ex.result, null, 2)}
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
