'use client';

import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('[Onlorath Fault Boundary] Uncaught Runtime Exception:', error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 9999,
            backgroundColor: '#030014',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '2rem',
          }}
        >
          <div
            className="cyber-glass-panel corner-brackets"
            style={{
              maxWidth: '650px',
              width: '100%',
              padding: '2.5rem',
              borderRadius: '8px',
              border: '1px solid #ff007f',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem', marginBottom: '1.2rem' }}>
              <span
                style={{
                  display: 'inline-block',
                  width: '12px',
                  height: '12px',
                  backgroundColor: '#ff007f',
                  boxShadow: '0 0 10px #ff007f',
                  borderRadius: '50%',
                }}
              />
              <h2
                style={{
                  fontFamily: 'var(--font-display)',
                  color: '#ff007f',
                  fontSize: '1.3rem',
                  letterSpacing: '0.08em',
                }}
              >
                SYSTEM DIAGNOSTIC: FAULT TRAPPED
              </h2>
            </div>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '1rem' }}>
              A runtime anomaly was isolated by the fault boundary. The core WebGL engine or UI context encountered an unhandled condition.
            </p>
            <div
              style={{
                background: 'rgba(0, 0, 0, 0.6)',
                padding: '1rem',
                borderRadius: '4px',
                border: '1px solid rgba(255, 0, 127, 0.3)',
                fontFamily: 'var(--font-mono)',
                fontSize: '0.8rem',
                color: '#f87171',
                marginBottom: '1.5rem',
                overflowX: 'auto',
              }}
            >
              {this.state.error?.message || 'Unknown Exception'}
            </div>
            <button
              className="cyber-btn"
              onClick={() => {
                this.setState({ hasError: false, error: null });
                window.location.reload();
              }}
              style={{ borderColor: 'var(--neon-cyan)', color: 'var(--neon-cyan)' }}
            >
              [ REBOOT SYSTEM CORE ]
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
