'use client';

import { useState } from 'react';
import { sceneFSM } from '@/lib/stateMachine';
import { audioEngine } from '@/lib/audioEngine';
import { telemetryService } from '@/services/telemetryService';
import { ContactPayload } from '@/types';
import { Send, CheckCircle2, ShieldCheck, Terminal, AlertCircle } from 'lucide-react';

export function ContactNode() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: '',
  });

  const [status, setStatus] = useState<'IDLE' | 'TRANSMITTING' | 'CONFIRMED' | 'ERROR'>('IDLE');
  const [transmissionId, setTransmissionId] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.email || !formData.message) return;

    setStatus('TRANSMITTING');
    audioEngine.playKey();

    const payload: ContactPayload = {
      senderName: formData.name,
      senderEmail: formData.email,
      subject: formData.subject || 'Enterprise Architecture Query',
      message: formData.message,
      telemetryMetadata: {
        browserAgent: typeof navigator !== 'undefined' ? navigator.userAgent : 'Unknown',
        timestamp: new Date().toISOString(),
        sessionState: sceneFSM.getState(),
      },
    };

    try {
      const res = await telemetryService.transmitContact(payload);
      setTransmissionId(res.transmissionId);
      setStatus('CONFIRMED');
      audioEngine.playSuccess();
    } catch {
      setStatus('ERROR');
    }
  };

  return (
    <div
      style={{
        maxWidth: '1100px',
        margin: '0 auto',
        padding: '5.5rem 2rem 2rem 2rem',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        pointerEvents: 'none',
      }}
    >
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'minmax(320px, 1fr) 360px',
          gap: '1.5rem',
          height: 'calc(100vh - 7.5rem)',
          pointerEvents: 'auto',
        }}
      >
        {/* Contact Form Node */}
        <div
          className="cyber-glass-panel corner-brackets"
          style={{
            padding: '1.8rem',
            borderRadius: '6px',
            overflowY: 'auto',
            display: 'flex',
            flexDirection: 'column',
            gap: '1.2rem',
          }}
        >
          <div style={{ borderBottom: '1px solid rgba(0, 240, 255, 0.2)', paddingBottom: '0.8rem' }}>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.7rem', color: 'var(--neon-cyan)' }}>
              MODULE: TELEMETRY_TRANSMISSION
            </div>
            <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.5rem', fontWeight: 800, color: '#ffffff' }}>
              DIRECT TRANSMISSION NODE
            </h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginTop: '0.3rem' }}>
              Initiate contact for high-throughput backend architecture, AI agent consulting, or WebGL shader engineering.
            </p>
          </div>

          {status === 'CONFIRMED' ? (
            <div
              style={{
                background: 'rgba(0, 255, 157, 0.08)',
                border: '1px solid var(--neon-green)',
                padding: '2rem',
                borderRadius: '6px',
                textAlign: 'center',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '1rem',
              }}
            >
              <CheckCircle2 size={42} color="var(--neon-green)" />
              <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1.2rem', color: '#ffffff' }}>
                PAYLOAD ACKNOWLEDGED
              </h3>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', maxWidth: '420px' }}>
                Transmission received. The pipeline will route your message directly to the engineer.
              </p>
              <div
                style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: '0.8rem',
                  color: 'var(--neon-cyan)',
                  background: 'rgba(0,0,0,0.5)',
                  padding: '0.5rem 1rem',
                  borderRadius: '4px',
                  border: '1px solid rgba(0, 240, 255, 0.3)',
                }}
              >
                TRANSMISSION_ID: {transmissionId}
              </div>
              <button
                className="cyber-btn"
                onClick={() => {
                  setStatus('IDLE');
                  setFormData({ name: '', email: '', subject: '', message: '' });
                }}
                style={{ marginTop: '0.5rem' }}
              >
                [ SEND NEW TRANSMISSION ]
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label style={{ display: 'block', fontFamily: 'var(--font-mono)', fontSize: '0.7rem', color: 'var(--text-muted)', marginBottom: '0.3rem' }}>
                    SENDER IDENTIFIER (NAME) *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g. Alex Mercer"
                    style={{
                      width: '100%',
                      background: 'rgba(3, 0, 20, 0.7)',
                      border: '1px solid rgba(0, 240, 255, 0.25)',
                      borderRadius: '4px',
                      padding: '0.65rem 0.85rem',
                      color: '#ffffff',
                      fontFamily: 'var(--font-mono)',
                      fontSize: '0.85rem',
                      outline: 'none',
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontFamily: 'var(--font-mono)', fontSize: '0.7rem', color: 'var(--text-muted)', marginBottom: '0.3rem' }}>
                    DIRECT RETURN VECTOR (EMAIL) *
                  </label>
                  <input
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="e.g. alex@company.com"
                    style={{
                      width: '100%',
                      background: 'rgba(3, 0, 20, 0.7)',
                      border: '1px solid rgba(0, 240, 255, 0.25)',
                      borderRadius: '4px',
                      padding: '0.65rem 0.85rem',
                      color: '#ffffff',
                      fontFamily: 'var(--font-mono)',
                      fontSize: '0.85rem',
                      outline: 'none',
                    }}
                  />
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontFamily: 'var(--font-mono)', fontSize: '0.7rem', color: 'var(--text-muted)', marginBottom: '0.3rem' }}>
                  SUBJECT CLASSIFICATION
                </label>
                <input
                  type="text"
                  value={formData.subject}
                  onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                  placeholder="e.g. High-Throughput Go Consulting / WebGL Shader Project"
                  style={{
                    width: '100%',
                    background: 'rgba(3, 0, 20, 0.7)',
                    border: '1px solid rgba(0, 240, 255, 0.25)',
                    borderRadius: '4px',
                    padding: '0.65rem 0.85rem',
                    color: '#ffffff',
                    fontFamily: 'var(--font-mono)',
                    fontSize: '0.85rem',
                    outline: 'none',
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontFamily: 'var(--font-mono)', fontSize: '0.7rem', color: 'var(--text-muted)', marginBottom: '0.3rem' }}>
                  ENCRYPTED MESSAGE PAYLOAD *
                </label>
                <textarea
                  required
                  rows={5}
                  value={formData.message}
                  onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                  placeholder="Outline project requirements, SLA targets, or architecture inquiries..."
                  style={{
                    width: '100%',
                    background: 'rgba(3, 0, 20, 0.7)',
                    border: '1px solid rgba(0, 240, 255, 0.25)',
                    borderRadius: '4px',
                    padding: '0.65rem 0.85rem',
                    color: '#ffffff',
                    fontFamily: 'var(--font-mono)',
                    fontSize: '0.85rem',
                    outline: 'none',
                    resize: 'vertical',
                  }}
                />
              </div>

              <button
                type="submit"
                disabled={status === 'TRANSMITTING'}
                className="cyber-btn"
                style={{
                  alignSelf: 'flex-start',
                  fontSize: '0.88rem',
                  padding: '0.75rem 1.6rem',
                  marginTop: '0.4rem',
                }}
              >
                <Send size={15} />
                <span>{status === 'TRANSMITTING' ? 'ENCRYPTING & TRANSMITTING...' : 'TRANSMIT TELEMETRY PAYLOAD'}</span>
              </button>
            </form>
          )}
        </div>

        {/* Right Hexagonal Contract & Telemetry Inspector */}
        <div
          className="cyber-glass-panel corner-brackets"
          style={{
            padding: '1.2rem',
            borderRadius: '6px',
            display: 'flex',
            flexDirection: 'column',
            gap: '1rem',
            overflowY: 'auto',
          }}
        >
          <div>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.7rem', color: 'var(--neon-purple)', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <ShieldCheck size={14} />
              <span>FUTURE GO BACKEND CONTRACT</span>
            </div>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: '0.95rem', fontWeight: 700, color: '#ffffff', marginTop: '0.2rem' }}>
              HEXAGONAL INGESTION PORT
            </div>
          </div>

          <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', lineHeight: 1.45 }}>
            This transmission payload matches the Go REST interface specification (<code style={{ color: 'var(--neon-cyan)' }}>POST /api/v1/contact</code>) configured with raw SQL ingestion and JWT authentication guard.
          </div>

          <div>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.65rem', color: 'var(--text-muted)', marginBottom: '0.3rem' }}>
              REAL-TIME PAYLOAD JSON PREVIEW:
            </div>
            <pre
              style={{
                background: 'rgba(0, 0, 0, 0.75)',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                padding: '0.75rem',
                borderRadius: '4px',
                fontFamily: 'var(--font-mono)',
                fontSize: '0.7rem',
                color: '#38bdf8',
                overflowX: 'auto',
                lineHeight: 1.4,
              }}
            >
              <code>
                {JSON.stringify(
                  {
                    name: formData.name || 'ANONYMOUS_SENDER',
                    email: formData.email || 'pending@wire.io',
                    subject: formData.subject || 'System Query',
                    message_bytes: formData.message.length,
                    fsm_state: 'CONTACT',
                    status: status,
                  },
                  null,
                  2
                )}
              </code>
            </pre>
          </div>

          <div style={{ marginTop: 'auto', padding: '0.75rem', background: 'rgba(0, 240, 255, 0.05)', borderRadius: '4px', border: '1px solid rgba(0, 240, 255, 0.15)' }}>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.65rem', color: 'var(--neon-green)', marginBottom: '0.2rem' }}>
              ● ZERO ORM PERSISTENCE READY
            </div>
            <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
              Direct ingestion into PostgreSQL via raw SQL prepared statements.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
