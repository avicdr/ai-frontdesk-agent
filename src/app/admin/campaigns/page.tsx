'use client';

// src/app/admin/campaigns/page.tsx
// WhatsApp Cold Outreach Campaign Manager & Real-Time AI Qualification Console

import React, { useState, useEffect, useMemo, useRef } from 'react';
import Link from 'next/link';
import { Campaign, CampaignLead, ConnectedSenderOption, LeadQualification, LeadStatus } from '@/lib/campaigns/types';

export default function AdminCampaignsPage() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [senders, setSenders] = useState<ConnectedSenderOption[]>([]);
  const [selectedCampaignId, setSelectedCampaignId] = useState<string | null>(null);
  const [leads, setLeads] = useState<CampaignLead[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [leadsLoading, setLeadsLoading] = useState<boolean>(false);
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error' | 'info'; text: string } | null>(null);

  // Filters & search
  const [activeTab, setActiveTab] = useState<'all' | 'no_ai_manual' | 'has_ai' | 'sent' | 'pending'>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Modals state
  const [showCreateModal, setShowCreateModal] = useState<boolean>(false);
  const [showAddLeadsModal, setShowAddLeadsModal] = useState<boolean>(false);
  const [showSettingsModal, setShowSettingsModal] = useState<boolean>(false);
  const [showTestModal, setShowTestModal] = useState<boolean>(false);

  // Create Campaign Form
  const [newCampaignName, setNewCampaignName] = useState<string>('');
  const [newCampaignOrgId, setNewCampaignOrgId] = useState<string>('');
  const [newCampaignTemplate, setNewCampaignTemplate] = useState<string>(
    'Hi {{name}}, are you currently taking new patient appointments for {{clinic_name}} this week?'
  );
  const [newCampaignThreshold, setNewCampaignThreshold] = useState<number>(60);
  const [newCampaignDelay, setNewCampaignDelay] = useState<number>(5);
  const [submittingCreate, setSubmittingCreate] = useState<boolean>(false);

  // Add Leads Form
  const [addMode, setAddMode] = useState<'bulk' | 'single'>('bulk');
  const [rawLeadsText, setRawLeadsText] = useState<string>('');
  const [singleLeadName, setSingleLeadName] = useState<string>('');
  const [singleClinicName, setSingleClinicName] = useState<string>('');
  const [singleLeadPhone, setSingleLeadPhone] = useState<string>('');
  const [submittingLeads, setSubmittingLeads] = useState<boolean>(false);

  // Settings Edit Form
  const [editTemplate, setEditTemplate] = useState<string>('');
  const [editThreshold, setEditThreshold] = useState<number>(60);
  const [editDelay, setEditDelay] = useState<number>(5);
  const [submittingSettings, setSubmittingSettings] = useState<boolean>(false);

  // Test Send Form
  const [testPhone, setTestPhone] = useState<string>('');
  const [testName, setTestName] = useState<string>('Dr. Rajesh');
  const [testClinic, setTestClinic] = useState<string>('Apex Dental Care');
  const [submittingTest, setSubmittingTest] = useState<boolean>(false);

  // Action runners
  const [actionInProgress, setActionInProgress] = useState<string | null>(null);

  const selectedCampaign = useMemo(() => {
    return campaigns.find(c => c.id === selectedCampaignId) || null;
  }, [campaigns, selectedCampaignId]);

  // Load campaigns & senders list
  const loadCampaigns = async (silent: boolean = false) => {
    if (!silent) setLoading(true);
    try {
      const res = await fetch('/api/v1/admin/campaigns');
      const json = await res.json();
      if (json.data) {
        const camps: Campaign[] = json.data.campaigns || [];
        const sendersList: ConnectedSenderOption[] = json.data.senders || [];
        setCampaigns(camps);
        setSenders(sendersList);

        if (sendersList.length > 0 && !newCampaignOrgId) {
          setNewCampaignOrgId(sendersList[0].organizationId);
        }

        // Auto select first campaign if none selected
        if (!selectedCampaignId && camps.length > 0) {
          setSelectedCampaignId(camps[0].id);
        }
      }
    } catch (e: any) {
      console.error('Failed to load campaigns:', e);
      if (!silent) setStatusMessage({ type: 'error', text: 'Failed to load campaigns list' });
    } finally {
      if (!silent) setLoading(false);
    }
  };

  // Load specific campaign details and leads
  const loadCampaignDetails = async (campaignId: string, silent: boolean = false) => {
    if (!silent) setLeadsLoading(true);
    try {
      const res = await fetch(`/api/v1/admin/campaigns/${campaignId}`);
      const json = await res.json();
      if (json.data) {
        setLeads(json.data.leads || []);
        if (json.data.campaign) {
          // Update in campaigns list
          setCampaigns(prev => prev.map(c => c.id === campaignId ? json.data.campaign : c));
          // Prepopulate edit forms
          setEditTemplate(json.data.campaign.messageTemplate);
          setEditThreshold(json.data.campaign.responseThresholdSeconds);
          setEditDelay(json.data.campaign.delaySeconds);
        }
      }
    } catch (e: any) {
      console.error('Failed to load campaign leads:', e);
    } finally {
      if (!silent) setLeadsLoading(false);
    }
  };

  useEffect(() => {
    loadCampaigns();
  }, []);

  useEffect(() => {
    if (selectedCampaignId) {
      loadCampaignDetails(selectedCampaignId);
    } else {
      setLeads([]);
    }
  }, [selectedCampaignId]);

  // Auto-refresh polling when active campaign is running
  useEffect(() => {
    if (!selectedCampaign || selectedCampaign.status !== 'running') return;

    const interval = setInterval(() => {
      loadCampaignDetails(selectedCampaign.id, true);
      loadCampaigns(true);
    }, 4000);

    return () => clearInterval(interval);
  }, [selectedCampaign?.status, selectedCampaign?.id]);

  // Handle Campaign Actions: Start / Pause / Reset
  const handleCampaignAction = async (action: 'start' | 'pause' | 'reset') => {
    if (!selectedCampaignId) return;
    setActionInProgress(action);
    setStatusMessage(null);

    try {
      const res = await fetch(`/api/v1/admin/campaigns/${selectedCampaignId}/actions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action }),
      });
      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.error?.message || `Failed to ${action} campaign`);
      }

      setStatusMessage({
        type: 'success',
        text: action === 'start'
          ? '🚀 Campaign launched! Dispatching WhatsApp messages in background...'
          : action === 'pause'
          ? '⏸️ Campaign paused.'
          : '🔄 All leads reset to Pending.',
      });

      // Reload
      await loadCampaignDetails(selectedCampaignId);
      await loadCampaigns(true);
    } catch (e: any) {
      console.error(e);
      setStatusMessage({ type: 'error', text: e.message || `Action ${action} failed` });
    } finally {
      setActionInProgress(null);
    }
  };

  // Handle Create Campaign
  const handleCreateCampaign = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCampaignName.trim()) {
      setStatusMessage({ type: 'error', text: 'Campaign name is required' });
      return;
    }

    setSubmittingCreate(true);
    setStatusMessage(null);

    try {
      const res = await fetch('/api/v1/admin/campaigns', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newCampaignName.trim(),
          organizationId: newCampaignOrgId || 'default',
          messageTemplate: newCampaignTemplate.trim(),
          responseThresholdSeconds: Number(newCampaignThreshold),
          delaySeconds: Number(newCampaignDelay),
        }),
      });

      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.error?.message || 'Failed to create campaign');
      }

      const created: Campaign = json.data.campaign;
      setStatusMessage({ type: 'success', text: `Campaign "${created.name}" created successfully!` });
      setShowCreateModal(false);
      setNewCampaignName('');
      await loadCampaigns();
      setSelectedCampaignId(created.id);
    } catch (e: any) {
      console.error(e);
      setStatusMessage({ type: 'error', text: e.message || 'Error creating campaign' });
    } finally {
      setSubmittingCreate(false);
    }
  };

  // Handle Add Leads
  const handleAddLeads = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCampaignId) return;

    setSubmittingLeads(true);
    setStatusMessage(null);

    try {
      let payload: any = {};
      if (addMode === 'bulk') {
        if (!rawLeadsText.trim()) {
          setStatusMessage({ type: 'error', text: 'Please paste lead phone numbers' });
          setSubmittingLeads(false);
          return;
        }
        payload = { rawText: rawLeadsText };
      } else {
        if (!singleLeadPhone.trim()) {
          setStatusMessage({ type: 'error', text: 'Please enter a valid phone number' });
          setSubmittingLeads(false);
          return;
        }
        payload = {
          leads: [{
            phone: singleLeadPhone.trim(),
            name: singleLeadName.trim() || 'Doctor',
            clinicName: singleClinicName.trim() || 'Dental Clinic',
          }],
        };
      }

      const res = await fetch(`/api/v1/admin/campaigns/${selectedCampaignId}/leads`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.error?.message || 'Failed to add leads');
      }

      setStatusMessage({ type: 'success', text: json.data?.message || 'Leads imported successfully!' });
      setShowAddLeadsModal(false);
      setRawLeadsText('');
      setSingleLeadPhone('');
      setSingleLeadName('');
      setSingleClinicName('');
      await loadCampaignDetails(selectedCampaignId);
      await loadCampaigns(true);
    } catch (e: any) {
      console.error(e);
      setStatusMessage({ type: 'error', text: e.message || 'Failed to import leads' });
    } finally {
      setSubmittingLeads(false);
    }
  };

  // Handle Save Settings
  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCampaignId) return;

    setSubmittingSettings(true);
    setStatusMessage(null);

    try {
      const res = await fetch(`/api/v1/admin/campaigns/${selectedCampaignId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messageTemplate: editTemplate.trim(),
          responseThresholdSeconds: Number(editThreshold),
          delaySeconds: Number(editDelay),
        }),
      });

      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.error?.message || 'Failed to update settings');
      }

      setStatusMessage({ type: 'success', text: 'Campaign settings and template updated!' });
      setShowSettingsModal(false);
      await loadCampaignDetails(selectedCampaignId);
      await loadCampaigns(true);
    } catch (e: any) {
      console.error(e);
      setStatusMessage({ type: 'error', text: e.message || 'Error updating settings' });
    } finally {
      setSubmittingSettings(false);
    }
  };

  // Handle Test Send
  const handleTestSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCampaignId || !testPhone.trim()) {
      setStatusMessage({ type: 'error', text: 'Please enter a test phone number' });
      return;
    }

    setSubmittingTest(true);
    setStatusMessage(null);

    try {
      const res = await fetch(`/api/v1/admin/campaigns/${selectedCampaignId}/actions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'test_send',
          testPhone: testPhone.trim(),
          testName: testName.trim(),
          testClinicName: testClinic.trim(),
        }),
      });

      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.error?.message || 'Failed to send test message');
      }

      setStatusMessage({
        type: 'success',
        text: `✅ Test WhatsApp message dispatched to ${testPhone}! Check your phone.`,
      });
      setShowTestModal(false);
    } catch (e: any) {
      console.error(e);
      setStatusMessage({ type: 'error', text: e.message || 'Error sending test message' });
    } finally {
      setSubmittingTest(false);
    }
  };

  // Handle Delete Lead
  const handleDeleteLead = async (leadId: string) => {
    if (!selectedCampaignId) return;
    if (!confirm('Are you sure you want to remove this lead?')) return;

    try {
      const res = await fetch(`/api/v1/admin/campaigns/${selectedCampaignId}/leads/${leadId}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        setLeads(prev => prev.filter(l => l.id !== leadId));
        loadCampaigns(true);
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Handle Delete Campaign
  const handleDeleteCampaign = async () => {
    if (!selectedCampaignId || !selectedCampaign) return;
    if (!confirm(`Are you sure you want to delete campaign "${selectedCampaign.name}" and all its leads?`)) return;

    try {
      const res = await fetch(`/api/v1/admin/campaigns/${selectedCampaignId}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        setStatusMessage({ type: 'info', text: `Campaign "${selectedCampaign.name}" deleted.` });
        setSelectedCampaignId(null);
        await loadCampaigns();
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Export Leads to CSV
  const handleExportCSV = () => {
    if (!leads.length || !selectedCampaign) return;

    const headers = [
      'Phone',
      'Name',
      'Clinic Name',
      'Send Status',
      'Qualification',
      'Response Time (Seconds)',
      'Sent At',
      'Replied At',
      'Incoming Reply Message',
      'AI Audit Notes',
    ];

    const rows = leads.map(l => [
      `"${l.phone}"`,
      `"${l.name || ''}"`,
      `"${l.clinicName || ''}"`,
      `"${l.status}"`,
      `"${l.qualificationStatus}"`,
      `"${l.responseTimeSeconds ?? ''}"`,
      `"${l.sentAt || ''}"`,
      `"${l.repliedAt || ''}"`,
      `"${(l.replyText || '').replace(/"/g, '""')}"`,
      `"${(l.aiNotes || '').replace(/"/g, '""')}"`,
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `leads_${selectedCampaign.name.toLowerCase().replace(/[^a-z0-9]/g, '_')}_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Filtered Leads
  const filteredLeads = useMemo(() => {
    let result = leads;

    if (activeTab === 'no_ai_manual') {
      result = result.filter(l => l.qualificationStatus === 'no_ai_manual');
    } else if (activeTab === 'has_ai') {
      result = result.filter(l => l.qualificationStatus === 'has_ai');
    } else if (activeTab === 'sent') {
      result = result.filter(l => l.status === 'sent');
    } else if (activeTab === 'pending') {
      result = result.filter(l => l.status === 'pending');
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter(
        l =>
          l.phone.toLowerCase().includes(q) ||
          l.name.toLowerCase().includes(q) ||
          l.clinicName.toLowerCase().includes(q) ||
          (l.replyText && l.replyText.toLowerCase().includes(q))
      );
    }

    return result;
  }, [leads, activeTab, searchQuery]);

  // Count leads from bulk text
  const bulkLeadCount = useMemo(() => {
    if (!rawLeadsText.trim()) return 0;
    return rawLeadsText.split('\n').filter(l => l.trim().length > 0).length;
  }, [rawLeadsText]);

  // Connected sender check
  const activeSender = senders.find(s => s.status === 'connected') || senders[0];

  return (
    <div style={{ maxWidth: 1400, margin: '0 auto', paddingBottom: '3rem' }}>
      {/* Top Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.5rem' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.25rem' }}>
            <span style={{ fontSize: '1.75rem' }}>🚀</span>
            <h1 style={{ fontSize: '1.75rem', fontWeight: 800 }}>WhatsApp Outreach & AI Qualification Engine</h1>
          </div>
          <p style={{ color: 'hsl(var(--color-text-muted))', fontSize: '0.875rem', maxWidth: 800 }}>
            Blast personalized WhatsApp outreach campaigns to clinic leads, measure response latency down to the second,
            and automatically qualify clinics with <strong>Manual Receptionists (Hot Sales Leads)</strong> vs. <strong>AI Bots</strong>.
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
          <button
            onClick={() => {
              loadCampaigns();
              if (selectedCampaignId) loadCampaignDetails(selectedCampaignId);
            }}
            className="btn btn-outline"
            style={{ fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}
          >
            <span>🔄</span> Refresh
          </button>

          {selectedCampaign && leads.length > 0 && (
            <button
              onClick={handleExportCSV}
              className="btn btn-outline"
              style={{ fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.4rem', borderColor: 'hsl(142 71% 45% / 0.5)' }}
            >
              <span>📥</span> Export CSV
            </button>
          )}

          {selectedCampaign && (
            <button
              onClick={() => setShowTestModal(true)}
              className="btn btn-secondary"
              style={{ fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}
            >
              <span>🧪</span> Test Send
            </button>
          )}

          <button
            onClick={() => setShowCreateModal(true)}
            className="btn btn-primary"
            style={{ fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}
          >
            <span>➕</span> New Campaign
          </button>
        </div>
      </div>

      {/* Global Status Banner */}
      {statusMessage && (
        <div
          style={{
            marginBottom: '1.25rem',
            padding: '0.75rem 1.25rem',
            borderRadius: 'var(--radius-md)',
            background:
              statusMessage.type === 'success'
                ? 'hsl(142 71% 45% / 0.15)'
                : statusMessage.type === 'error'
                ? 'hsl(0 84% 60% / 0.15)'
                : 'hsl(221 83% 58% / 0.15)',
            border: `1px solid ${
              statusMessage.type === 'success'
                ? 'hsl(142 71% 45% / 0.3)'
                : statusMessage.type === 'error'
                ? 'hsl(0 84% 60% / 0.3)'
                : 'hsl(221 83% 58% / 0.3)'
            }`,
            color:
              statusMessage.type === 'success'
                ? 'hsl(142 71% 55%)'
                : statusMessage.type === 'error'
                ? 'hsl(0 84% 65%)'
                : 'hsl(221 83% 68%)',
            fontSize: '0.875rem',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <span>{statusMessage.text}</span>
          <button
            onClick={() => setStatusMessage(null)}
            style={{ background: 'none', border: 'none', color: 'inherit', cursor: 'pointer', fontSize: '1rem' }}
          >
            ✕
          </button>
        </div>
      )}

      {/* WhatsApp Sender Status Banner */}
      <div
        className="card"
        style={{
          marginBottom: '1.5rem',
          padding: '1rem 1.25rem',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '1rem',
          background: 'linear-gradient(135deg, hsl(265 40% 12%) 0%, hsl(222 40% 9%) 100%)',
          borderColor: 'hsl(265 30% 25%)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div
            style={{
              width: 38,
              height: 38,
              borderRadius: '10px',
              background: 'hsl(142 71% 45% / 0.2)',
              border: '1px solid hsl(142 71% 45% / 0.4)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '1.25rem',
            }}
          >
            💬
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span style={{ fontWeight: 700, fontSize: '0.95rem' }}>WhatsApp Sender Connection</span>
              {activeSender?.status === 'connected' ? (
                <span className="badge badge-success" style={{ fontSize: '0.7rem' }}>● Connected & Ready</span>
              ) : (
                <span className="badge badge-warning" style={{ fontSize: '0.7rem' }}>⚠️ Disconnected / Needs Scan</span>
              )}
            </div>
            <div style={{ fontSize: '0.75rem', color: 'hsl(var(--color-text-muted))', marginTop: '0.15rem' }}>
              {activeSender?.phoneNumber ? (
                <span>Outbound messages will be sent from <strong>{activeSender.phoneNumber}</strong> ({activeSender.clinicName})</span>
              ) : (
                <span>No phone number registered yet. Connect WhatsApp in the clinic dashboard or scan QR code.</span>
              )}
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Link
            href="/dashboard/onboarding"
            className="btn btn-outline"
            style={{ fontSize: '0.75rem', padding: '0.35rem 0.75rem' }}
          >
            Manage Connections 📱
          </Link>
        </div>
      </div>

      {/* Campaign Selector / Switcher */}
      {campaigns.length > 0 ? (
        <div style={{ marginBottom: '1.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
            <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'hsl(var(--color-text-secondary))' }}>Select Campaign:</span>
          </div>
          <div style={{ display: 'flex', gap: '0.5rem', overflowX: 'auto', paddingBottom: '0.5rem' }}>
            {campaigns.map(camp => {
              const isSelected = camp.id === selectedCampaignId;
              const isRunning = camp.status === 'running';
              return (
                <button
                  key={camp.id}
                  onClick={() => setSelectedCampaignId(camp.id)}
                  style={{
                    background: isSelected ? 'hsl(221 83% 58% / 0.15)' : 'hsl(var(--color-surface))',
                    border: `1px solid ${isSelected ? 'hsl(221 83% 58%)' : 'hsl(var(--color-border))'}`,
                    borderRadius: 'var(--radius-md)',
                    padding: '0.6rem 1rem',
                    textAlign: 'left',
                    cursor: 'pointer',
                    minWidth: '220px',
                    transition: 'all 0.15s ease',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.25rem' }}>
                    <span style={{ fontWeight: 700, fontSize: '0.875rem', color: isSelected ? 'hsl(var(--color-primary-glow))' : 'hsl(var(--color-text-primary))' }}>
                      {camp.name}
                    </span>
                    <span
                      className={`badge ${
                        isRunning ? 'badge-success' : camp.status === 'paused' ? 'badge-warning' : 'badge-info'
                      }`}
                      style={{ fontSize: '0.65rem', padding: '0.15rem 0.4rem' }}
                    >
                      {isRunning ? '⚡ Running' : camp.status}
                    </span>
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'hsl(var(--color-text-muted))' }}>
                    {camp.stats.totalLeads} leads • {camp.stats.repliedCount} replies
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      ) : (
        <div className="card" style={{ textAlign: 'center', padding: '3rem 1.5rem', marginBottom: '1.5rem' }}>
          <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🚀</div>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '0.5rem' }}>No Campaigns Found</h2>
          <p style={{ color: 'hsl(var(--color-text-muted))', fontSize: '0.875rem', maxWidth: 500, margin: '0 auto 1.5rem' }}>
            Get started by creating your first WhatsApp outreach campaign. You can import leads, set a custom message template,
            and auto-qualify clinics in real-time.
          </p>
          <button onClick={() => setShowCreateModal(true)} className="btn btn-primary">
            ➕ Create Your First Campaign
          </button>
        </div>
      )}

      {/* Selected Campaign Active Console */}
      {selectedCampaign && (
        <>
          {/* Campaign Action Control Bar */}
          <div
            className="card"
            style={{
              padding: '1.25rem',
              marginBottom: '1.5rem',
              background: 'hsl(var(--color-surface))',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: '1rem',
            }}
          >
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.25rem' }}>
                <h2 style={{ fontSize: '1.25rem', fontWeight: 800 }}>{selectedCampaign.name}</h2>
                <span
                  className={`badge ${
                    selectedCampaign.status === 'running'
                      ? 'badge-success'
                      : selectedCampaign.status === 'paused'
                      ? 'badge-warning'
                      : 'badge-info'
                  }`}
                  style={{ fontSize: '0.75rem' }}
                >
                  {selectedCampaign.status === 'running' ? '⚡ RUNNING IN BACKGROUND' : selectedCampaign.status.toUpperCase()}
                </span>
              </div>
              <div style={{ fontSize: '0.78rem', color: 'hsl(var(--color-text-muted))' }}>
                AI Threshold: <strong>≤ {selectedCampaign.responseThresholdSeconds}s = Bot</strong> •
                Safe Throttle: <strong>{selectedCampaign.delaySeconds}s delay</strong> •
                Created: {new Date(selectedCampaign.createdAt).toLocaleDateString()}
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', flexWrap: 'wrap' }}>
              <button
                onClick={() => setShowAddLeadsModal(true)}
                className="btn btn-secondary"
                style={{ fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}
              >
                <span>➕</span> Add Leads
              </button>

              <button
                onClick={() => setShowSettingsModal(true)}
                className="btn btn-outline"
                style={{ fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}
              >
                <span>⚙️</span> Template & Settings
              </button>

              {selectedCampaign.status !== 'running' ? (
                <button
                  onClick={() => handleCampaignAction('start')}
                  disabled={actionInProgress === 'start' || selectedCampaign.stats.pendingCount === 0}
                  className="btn btn-primary"
                  style={{
                    fontSize: '0.85rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.4rem',
                    background: 'linear-gradient(135deg, hsl(142 71% 45%) 0%, hsl(162 73% 46%) 100%)',
                    borderColor: 'hsl(142 71% 45%)',
                  }}
                >
                  <span>▶️</span> {actionInProgress === 'start' ? 'Starting...' : 'Start Campaign'}
                </button>
              ) : (
                <button
                  onClick={() => handleCampaignAction('pause')}
                  disabled={actionInProgress === 'pause'}
                  className="btn btn-warning"
                  style={{ fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}
                >
                  <span>⏸️</span> {actionInProgress === 'pause' ? 'Pausing...' : 'Pause Campaign'}
                </button>
              )}

              <button
                onClick={() => {
                  if (confirm('Reset all leads back to Pending? This will allow you to re-run the campaign.')) {
                    handleCampaignAction('reset');
                  }
                }}
                disabled={actionInProgress === 'reset'}
                className="btn btn-outline"
                title="Reset lead statuses to re-send"
                style={{ fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.3rem' }}
              >
                <span>🔄</span> Reset
              </button>

              <button
                onClick={handleDeleteCampaign}
                className="btn btn-outline"
                title="Delete Campaign"
                style={{ fontSize: '0.85rem', color: 'hsl(var(--color-error))', borderColor: 'hsl(0 84% 60% / 0.3)' }}
              >
                🗑️
              </button>
            </div>
          </div>

          {/* KPI Stat Cards */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))',
              gap: '1rem',
              marginBottom: '1.5rem',
            }}
          >
            {/* Total Leads */}
            <div className="stat-card">
              <div className="stat-value">{selectedCampaign.stats.totalLeads}</div>
              <div className="stat-label">Total Leads Audited</div>
              <div style={{ fontSize: '0.72rem', color: 'hsl(var(--color-text-muted))', marginTop: '0.35rem' }}>
                {selectedCampaign.stats.pendingCount} queued for dispatch
              </div>
            </div>

            {/* Messages Sent */}
            <div className="stat-card">
              <div className="stat-value" style={{ color: 'hsl(var(--color-primary-glow))' }}>
                {selectedCampaign.stats.sentCount}
              </div>
              <div className="stat-label">Messages Dispatched</div>
              <div style={{ fontSize: '0.72rem', color: 'hsl(var(--color-text-muted))', marginTop: '0.35rem' }}>
                {selectedCampaign.stats.totalLeads > 0
                  ? `${Math.round((selectedCampaign.stats.sentCount / selectedCampaign.stats.totalLeads) * 100)}% sent`
                  : '0%'}
              </div>
            </div>

            {/* Replies */}
            <div className="stat-card">
              <div className="stat-value" style={{ color: 'hsl(199 89% 55%)' }}>
                {selectedCampaign.stats.repliedCount}
              </div>
              <div className="stat-label">Replies Ingested</div>
              <div style={{ fontSize: '0.72rem', color: 'hsl(var(--color-text-muted))', marginTop: '0.35rem' }}>
                {selectedCampaign.stats.sentCount > 0
                  ? `${Math.round((selectedCampaign.stats.repliedCount / selectedCampaign.stats.sentCount) * 100)}% response rate`
                  : 'Awaiting replies'}
              </div>
            </div>

            {/* HOT LEADS: No AI (Manual Front Desk) */}
            <div
              className="stat-card"
              style={{
                background: 'linear-gradient(135deg, hsl(142 71% 45% / 0.15) 0%, hsl(222 40% 8%) 100%)',
                border: '1px solid hsl(142 71% 45% / 0.4)',
              }}
            >
              <div className="stat-value" style={{ color: 'hsl(142 71% 55%)' }}>
                🎯 {selectedCampaign.stats.noAiManualCount}
              </div>
              <div className="stat-label" style={{ color: 'hsl(142 71% 65%)', fontWeight: 700 }}>
                HOT LEADS (No AI / Manual)
              </div>
              <div style={{ fontSize: '0.72rem', color: 'hsl(var(--color-text-muted))', marginTop: '0.35rem' }}>
                Took &gt;{selectedCampaign.responseThresholdSeconds}s • Prime pitch target
              </div>
            </div>

            {/* HAS AI BOT */}
            <div
              className="stat-card"
              style={{
                background: 'linear-gradient(135deg, hsl(265 83% 65% / 0.15) 0%, hsl(222 40% 8%) 100%)',
                border: '1px solid hsl(265 83% 65% / 0.4)',
              }}
            >
              <div className="stat-value" style={{ color: 'hsl(265 83% 75%)' }}>
                🤖 {selectedCampaign.stats.hasAiCount}
              </div>
              <div className="stat-label" style={{ color: 'hsl(265 83% 75%)', fontWeight: 700 }}>
                Has AI Automation
              </div>
              <div style={{ fontSize: '0.72rem', color: 'hsl(var(--color-text-muted))', marginTop: '0.35rem' }}>
                Replied in ≤{selectedCampaign.responseThresholdSeconds}s (Bot detected)
              </div>
            </div>

            {/* Average Response Time */}
            <div className="stat-card">
              <div className="stat-value" style={{ color: 'hsl(38 92% 55%)' }}>
                {selectedCampaign.stats.avgResponseTimeSeconds != null
                  ? `${selectedCampaign.stats.avgResponseTimeSeconds}s`
                  : '—'}
              </div>
              <div className="stat-label">Avg Response Latency</div>
              <div style={{ fontSize: '0.72rem', color: 'hsl(var(--color-text-muted))', marginTop: '0.35rem' }}>
                Across all clinic replies
              </div>
            </div>
          </div>

          {/* Qualification Logic Explainer Banner */}
          <div
            style={{
              padding: '0.85rem 1.25rem',
              borderRadius: 'var(--radius-md)',
              background: 'hsl(var(--color-surface-2))',
              border: '1px solid hsl(var(--color-border))',
              marginBottom: '1.5rem',
              display: 'flex',
              alignItems: 'center',
              gap: '1rem',
              flexWrap: 'wrap',
              fontSize: '0.82rem',
            }}
          >
            <span style={{ fontSize: '1.25rem' }}>💡</span>
            <div style={{ flex: 1 }}>
              <strong style={{ color: 'hsl(var(--color-text-primary))' }}>How Lead Qualification Works:</strong>{' '}
              <span style={{ color: 'hsl(var(--color-text-secondary))' }}>
                When a clinic replies, we compute elapsed seconds between dispatch and incoming reply.
                If <strong>≤ {selectedCampaign.responseThresholdSeconds} seconds</strong>, they are flagged as{' '}
                <span className="badge badge-secondary" style={{ fontSize: '0.65rem' }}>🤖 HAS AI AUTOMATION</span>{' '}
                (automated WhatsApp bot). If <strong>&gt; {selectedCampaign.responseThresholdSeconds} seconds</strong>, they are flagged as{' '}
                <span className="badge badge-success" style={{ fontSize: '0.65rem' }}>🎯 NO AI (MANUAL FRONT DESK)</span>{' '}
                — these are your <strong>hottest sales prospects</strong> to pitch AI Front Desk!
              </span>
            </div>
          </div>

          {/* Leads Table Card */}
          <div className="card" style={{ padding: '1.25rem' }}>
            {/* Table Filters & Search */}
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: '1rem',
                marginBottom: '1.25rem',
                paddingBottom: '1rem',
                borderBottom: '1px solid hsl(var(--color-border))',
              }}
            >
              {/* Tabs */}
              <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
                {[
                  { id: 'all', label: `All Leads (${leads.length})` },
                  { id: 'no_ai_manual', label: `🎯 Hot Prospects (${selectedCampaign.stats.noAiManualCount})`, color: 'hsl(142 71% 45%)' },
                  { id: 'has_ai', label: `🤖 Has AI (${selectedCampaign.stats.hasAiCount})`, color: 'hsl(265 83% 65%)' },
                  { id: 'sent', label: `⏳ Sent (${selectedCampaign.stats.sentCount - selectedCampaign.stats.repliedCount})` },
                  { id: 'pending', label: `Pending (${selectedCampaign.stats.pendingCount})` },
                ].map(tab => {
                  const isActive = activeTab === tab.id;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id as any)}
                      style={{
                        padding: '0.4rem 0.85rem',
                        borderRadius: 'var(--radius-sm)',
                        fontSize: '0.8rem',
                        fontWeight: 600,
                        cursor: 'pointer',
                        background: isActive ? (tab.color ? `${tab.color}33` : 'hsl(221 83% 58% / 0.2)') : 'transparent',
                        color: isActive ? (tab.color || 'hsl(var(--color-primary-glow))') : 'hsl(var(--color-text-secondary))',
                        border: `1px solid ${isActive ? (tab.color || 'hsl(var(--color-primary))') : 'transparent'}`,
                        transition: 'all 0.15s ease',
                      }}
                    >
                      {tab.label}
                    </button>
                  );
                })}
              </div>

              {/* Search Bar */}
              <div style={{ position: 'relative', minWidth: '240px' }}>
                <input
                  type="text"
                  placeholder="Search phone, doctor, clinic..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="input"
                  style={{
                    fontSize: '0.8rem',
                    padding: '0.45rem 0.85rem',
                    width: '100%',
                    background: 'hsl(var(--color-surface-2))',
                  }}
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    style={{
                      position: 'absolute',
                      right: 8,
                      top: '50%',
                      transform: 'translateY(-50%)',
                      background: 'none',
                      border: 'none',
                      color: 'hsl(var(--color-text-muted))',
                      cursor: 'pointer',
                    }}
                  >
                    ✕
                  </button>
                )}
              </div>
            </div>

            {/* Table */}
            {leadsLoading ? (
              <div style={{ textAlign: 'center', padding: '2rem', color: 'hsl(var(--color-text-muted))' }}>
                Loading leads...
              </div>
            ) : filteredLeads.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '3rem 1rem', color: 'hsl(var(--color-text-muted))' }}>
                <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>📭</div>
                <div style={{ fontWeight: 600 }}>No leads match the selected filter.</div>
                {leads.length === 0 && (
                  <button
                    onClick={() => setShowAddLeadsModal(true)}
                    className="btn btn-secondary"
                    style={{ marginTop: '1rem', fontSize: '0.85rem' }}
                  >
                    ➕ Import Leads Now
                  </button>
                )}
              </div>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.85rem' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid hsl(var(--color-border))', color: 'hsl(var(--color-text-muted))' }}>
                      <th style={{ padding: '0.75rem 0.5rem' }}>LEAD & CLINIC</th>
                      <th style={{ padding: '0.75rem 0.5rem' }}>WHATSAPP NUMBER</th>
                      <th style={{ padding: '0.75rem 0.5rem' }}>DISPATCH STATUS</th>
                      <th style={{ padding: '0.75rem 0.5rem' }}>AI QUALIFICATION</th>
                      <th style={{ padding: '0.75rem 0.5rem' }}>RESPONSE TIME</th>
                      <th style={{ padding: '0.75rem 0.5rem' }}>INCOMING REPLY</th>
                      <th style={{ padding: '0.75rem 0.5rem', textAlign: 'right' }}>ACTIONS</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredLeads.map(lead => {
                      const isNoAi = lead.qualificationStatus === 'no_ai_manual';
                      const isHasAi = lead.qualificationStatus === 'has_ai';
                      const isReplied = lead.status === 'replied';

                      return (
                        <tr
                          key={lead.id}
                          style={{
                            borderBottom: '1px solid hsl(var(--color-border-subtle))',
                            background: isNoAi
                              ? 'hsl(142 71% 45% / 0.04)'
                              : isHasAi
                              ? 'hsl(265 83% 65% / 0.03)'
                              : 'transparent',
                          }}
                        >
                          {/* Lead & Clinic */}
                          <td style={{ padding: '0.75rem 0.5rem' }}>
                            <div style={{ fontWeight: 700, color: 'hsl(var(--color-text-primary))' }}>
                              {lead.name}
                            </div>
                            <div style={{ fontSize: '0.75rem', color: 'hsl(var(--color-text-muted))' }}>
                              {lead.clinicName}
                            </div>
                          </td>

                          {/* WhatsApp Phone */}
                          <td style={{ padding: '0.75rem 0.5rem' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                              <span style={{ fontFamily: 'monospace', fontWeight: 600 }}>+{lead.phone}</span>
                              <a
                                href={`https://wa.me/${lead.phone}`}
                                target="_blank"
                                rel="noreferrer"
                                title="Open WhatsApp Chat"
                                style={{
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  width: 20,
                                  height: 20,
                                  borderRadius: 4,
                                  background: 'hsl(142 71% 45% / 0.2)',
                                  color: 'hsl(142 71% 55%)',
                                  textDecoration: 'none',
                                  fontSize: '0.7rem',
                                }}
                              >
                                ↗
                              </a>
                            </div>
                          </td>

                          {/* Dispatch Status */}
                          <td style={{ padding: '0.75rem 0.5rem' }}>
                            {lead.status === 'pending' && <span className="badge badge-neutral" style={{ fontSize: '0.7rem' }}>Pending</span>}
                            {lead.status === 'sending' && <span className="badge badge-info" style={{ fontSize: '0.7rem' }}>Sending...</span>}
                            {lead.status === 'sent' && <span className="badge badge-info" style={{ fontSize: '0.7rem' }}>Sent 📤</span>}
                            {lead.status === 'replied' && <span className="badge badge-success" style={{ fontSize: '0.7rem' }}>Replied 💬</span>}
                            {lead.status === 'failed' && <span className="badge badge-error" style={{ fontSize: '0.7rem' }}>Failed ❌</span>}
                          </td>

                          {/* Qualification Status */}
                          <td style={{ padding: '0.75rem 0.5rem' }}>
                            {isNoAi && (
                              <span
                                className="badge badge-success"
                                title={lead.aiNotes || 'Manual human receptionist identified'}
                                style={{
                                  fontSize: '0.72rem',
                                  fontWeight: 700,
                                  background: 'hsl(142 71% 45% / 0.2)',
                                  color: 'hsl(142 71% 60%)',
                                  border: '1px solid hsl(142 71% 45% / 0.4)',
                                  padding: '0.25rem 0.6rem',
                                }}
                              >
                                🎯 NO AI (MANUAL)
                              </span>
                            )}
                            {isHasAi && (
                              <span
                                className="badge badge-secondary"
                                title={lead.aiNotes || 'AI Bot responded instantly'}
                                style={{
                                  fontSize: '0.72rem',
                                  fontWeight: 700,
                                  background: 'hsl(265 83% 65% / 0.2)',
                                  color: 'hsl(265 83% 75%)',
                                  border: '1px solid hsl(265 83% 65% / 0.4)',
                                  padding: '0.25rem 0.6rem',
                                }}
                              >
                                🤖 HAS AI AUTOMATION
                              </span>
                            )}
                            {!isNoAi && !isHasAi && (
                              <span style={{ fontSize: '0.75rem', color: 'hsl(var(--color-text-muted))' }}>
                                {lead.status === 'sent' ? '⏳ Awaiting reply' : '—'}
                              </span>
                            )}
                          </td>

                          {/* Response Time */}
                          <td style={{ padding: '0.75rem 0.5rem' }}>
                            {lead.responseTimeSeconds != null ? (
                              <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                                <span
                                  style={{
                                    fontWeight: 700,
                                    fontFamily: 'monospace',
                                    color: isNoAi ? 'hsl(142 71% 55%)' : 'hsl(265 83% 75%)',
                                  }}
                                >
                                  {lead.responseTimeSeconds < 60
                                    ? `⚡ ${lead.responseTimeSeconds}s`
                                    : `⏱️ ${Math.floor(lead.responseTimeSeconds / 60)}m ${lead.responseTimeSeconds % 60}s`}
                                </span>
                              </div>
                            ) : (
                              <span style={{ color: 'hsl(var(--color-text-muted))' }}>—</span>
                            )}
                          </td>

                          {/* Incoming Reply */}
                          <td style={{ padding: '0.75rem 0.5rem', maxWidth: '280px' }}>
                            {lead.replyText ? (
                              <div
                                style={{
                                  background: 'hsl(var(--color-surface-2))',
                                  padding: '0.35rem 0.6rem',
                                  borderRadius: '6px',
                                  fontSize: '0.75rem',
                                  color: 'hsl(var(--color-text-primary))',
                                  border: '1px solid hsl(var(--color-border))',
                                  whiteSpace: 'nowrap',
                                  overflow: 'hidden',
                                  textOverflow: 'ellipsis',
                                }}
                                title={lead.replyText}
                              >
                                &ldquo;{lead.replyText}&rdquo;
                              </div>
                            ) : (
                              <span style={{ color: 'hsl(var(--color-text-muted))', fontSize: '0.75rem' }}>No reply yet</span>
                            )}
                          </td>

                          {/* Actions */}
                          <td style={{ padding: '0.75rem 0.5rem', textAlign: 'right' }}>
                            <button
                              onClick={() => handleDeleteLead(lead.id)}
                              style={{
                                background: 'none',
                                border: 'none',
                                color: 'hsl(var(--color-text-muted))',
                                cursor: 'pointer',
                                fontSize: '0.9rem',
                                padding: '0.2rem 0.4rem',
                              }}
                              title="Delete lead"
                            >
                              🗑️
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}

      {/* MODAL 1: Create Campaign */}
      {showCreateModal && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.7)',
            backdropFilter: 'blur(4px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999,
            padding: '1rem',
          }}
        >
          <div className="card" style={{ maxWidth: 580, width: '100%', padding: '1.5rem', maxHeight: '90vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <h3 style={{ fontSize: '1.2rem', fontWeight: 800 }}>➕ Create Outreach Campaign</h3>
              <button
                onClick={() => setShowCreateModal(false)}
                style={{ background: 'none', border: 'none', color: 'hsl(var(--color-text-muted))', cursor: 'pointer', fontSize: '1.2rem' }}
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateCampaign} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: '0.35rem' }}>
                  Campaign Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Mumbai Dental Clinics — Batch 1"
                  value={newCampaignName}
                  onChange={e => setNewCampaignName(e.target.value)}
                  className="input"
                  style={{ width: '100%' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: '0.35rem' }}>
                  WhatsApp Sender Connection
                </label>
                <select
                  value={newCampaignOrgId}
                  onChange={e => setNewCampaignOrgId(e.target.value)}
                  className="input"
                  style={{ width: '100%' }}
                >
                  {senders.length > 0 ? (
                    senders.map(s => (
                      <option key={s.organizationId} value={s.organizationId}>
                        {s.clinicName} ({s.phoneNumber || 'Connected Account'}) [{s.status}]
                      </option>
                    ))
                  ) : (
                    <option value="default">Default WhatsApp Connection</option>
                  )}
                </select>
                <span style={{ fontSize: '0.72rem', color: 'hsl(var(--color-text-muted))' }}>
                  The WhatsApp account used to fire outreach texts.
                </span>
              </div>

              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.35rem' }}>
                  <label style={{ fontSize: '0.8rem', fontWeight: 600 }}>Message Template *</label>
                  <span style={{ fontSize: '0.72rem', color: 'hsl(var(--color-text-muted))' }}>
                    Click variables to insert:
                  </span>
                </div>
                <div style={{ display: 'flex', gap: '0.4rem', marginBottom: '0.5rem', flexWrap: 'wrap' }}>
                  {['{{name}}', '{{clinic_name}}', '{{phone}}'].map(v => (
                    <button
                      key={v}
                      type="button"
                      onClick={() => setNewCampaignTemplate(prev => `${prev} ${v}`)}
                      style={{
                        padding: '0.2rem 0.5rem',
                        borderRadius: 4,
                        fontSize: '0.72rem',
                        background: 'hsl(var(--color-surface-2))',
                        border: '1px solid hsl(var(--color-border))',
                        color: 'hsl(var(--color-primary-glow))',
                        cursor: 'pointer',
                      }}
                    >
                      + {v}
                    </button>
                  ))}
                </div>
                <textarea
                  required
                  rows={4}
                  value={newCampaignTemplate}
                  onChange={e => setNewCampaignTemplate(e.target.value)}
                  className="input"
                  style={{ width: '100%', fontFamily: 'inherit', resize: 'vertical' }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: '0.35rem' }}>
                    AI Qualification Threshold (Seconds)
                  </label>
                  <input
                    type="number"
                    min={5}
                    max={600}
                    value={newCampaignThreshold}
                    onChange={e => setNewCampaignThreshold(Number(e.target.value))}
                    className="input"
                    style={{ width: '100%' }}
                  />
                  <span style={{ fontSize: '0.7rem', color: 'hsl(var(--color-text-muted))' }}>
                    ≤ {newCampaignThreshold}s = Bot. &gt; {newCampaignThreshold}s = Manual front desk.
                  </span>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: '0.35rem' }}>
                    Safe Throttle Delay (Seconds)
                  </label>
                  <input
                    type="number"
                    min={2}
                    max={60}
                    value={newCampaignDelay}
                    onChange={e => setNewCampaignDelay(Number(e.target.value))}
                    className="input"
                    style={{ width: '100%' }}
                  />
                  <span style={{ fontSize: '0.7rem', color: 'hsl(var(--color-text-muted))' }}>
                    Pause between sending each lead to avoid spam flags.
                  </span>
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1rem' }}>
                <button type="button" onClick={() => setShowCreateModal(false)} className="btn btn-outline">
                  Cancel
                </button>
                <button type="submit" disabled={submittingCreate} className="btn btn-primary">
                  {submittingCreate ? 'Creating...' : 'Create Campaign'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: Add Leads */}
      {showAddLeadsModal && selectedCampaign && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.7)',
            backdropFilter: 'blur(4px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999,
            padding: '1rem',
          }}
        >
          <div className="card" style={{ maxWidth: 620, width: '100%', padding: '1.5rem', maxHeight: '90vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <div>
                <h3 style={{ fontSize: '1.2rem', fontWeight: 800 }}>➕ Add Leads to &ldquo;{selectedCampaign.name}&rdquo;</h3>
                <p style={{ fontSize: '0.75rem', color: 'hsl(var(--color-text-muted))' }}>
                  Import WhatsApp numbers to be messaged and audited.
                </p>
              </div>
              <button
                onClick={() => setShowAddLeadsModal(false)}
                style={{ background: 'none', border: 'none', color: 'hsl(var(--color-text-muted))', cursor: 'pointer', fontSize: '1.2rem' }}
              >
                ✕
              </button>
            </div>

            {/* Mode Switcher */}
            <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem' }}>
              <button
                type="button"
                onClick={() => setAddMode('bulk')}
                className={`btn ${addMode === 'bulk' ? 'btn-primary' : 'btn-outline'}`}
                style={{ fontSize: '0.8rem', padding: '0.4rem 0.8rem' }}
              >
                📋 Bulk Paste / CSV
              </button>
              <button
                type="button"
                onClick={() => setAddMode('single')}
                className={`btn ${addMode === 'single' ? 'btn-primary' : 'btn-outline'}`}
                style={{ fontSize: '0.8rem', padding: '0.4rem 0.8rem' }}
              >
                👤 Single Lead
              </button>
            </div>

            <form onSubmit={handleAddLeads} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {addMode === 'bulk' ? (
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.35rem' }}>
                    <label style={{ fontSize: '0.8rem', fontWeight: 600 }}>
                      Paste Leads (One per line)
                    </label>
                    <span style={{ fontSize: '0.72rem', color: 'hsl(var(--color-primary-glow))' }}>
                      {bulkLeadCount} lead(s) detected
                    </span>
                  </div>
                  <div style={{ fontSize: '0.72rem', color: 'hsl(var(--color-text-muted))', marginBottom: '0.5rem' }}>
                    Accepted formats:
                    <br />• <code>919876543210, Dr. Rajesh Sharma, Apex Dental Care</code>
                    <br />• <code>9876543210, Dr. Rajesh</code>
                    <br />• <code>9876543210</code> (Just phone number)
                  </div>
                  <textarea
                    required
                    rows={8}
                    placeholder={`919876543210, Dr. Rajesh, Apex Dental Clinic\n919812345678, Dr. Priya, Smile Care\n919899887766`}
                    value={rawLeadsText}
                    onChange={e => setRawLeadsText(e.target.value)}
                    className="input"
                    style={{ width: '100%', fontFamily: 'monospace', fontSize: '0.8rem', resize: 'vertical' }}
                  />
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: '0.35rem' }}>
                      WhatsApp Phone Number *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. 919876543210 or 9876543210"
                      value={singleLeadPhone}
                      onChange={e => setSingleLeadPhone(e.target.value)}
                      className="input"
                      style={{ width: '100%' }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: '0.35rem' }}>
                      Lead / Doctor Name
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Dr. Rajesh Sharma"
                      value={singleLeadName}
                      onChange={e => setSingleLeadName(e.target.value)}
                      className="input"
                      style={{ width: '100%' }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: '0.35rem' }}>
                      Clinic / Business Name
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Apex Multispeciality Dental"
                      value={singleClinicName}
                      onChange={e => setSingleClinicName(e.target.value)}
                      className="input"
                      style={{ width: '100%' }}
                    />
                  </div>
                </div>
              )}

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1rem' }}>
                <button type="button" onClick={() => setShowAddLeadsModal(false)} className="btn btn-outline">
                  Cancel
                </button>
                <button type="submit" disabled={submittingLeads} className="btn btn-primary">
                  {submittingLeads ? 'Importing...' : 'Import Leads'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 3: Edit Template & Settings */}
      {showSettingsModal && selectedCampaign && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.7)',
            backdropFilter: 'blur(4px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999,
            padding: '1rem',
          }}
        >
          <div className="card" style={{ maxWidth: 580, width: '100%', padding: '1.5rem', maxHeight: '90vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <h3 style={{ fontSize: '1.2rem', fontWeight: 800 }}>⚙️ Campaign Settings & Template</h3>
              <button
                onClick={() => setShowSettingsModal(false)}
                style={{ background: 'none', border: 'none', color: 'hsl(var(--color-text-muted))', cursor: 'pointer', fontSize: '1.2rem' }}
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveSettings} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.35rem' }}>
                  <label style={{ fontSize: '0.8rem', fontWeight: 600 }}>Message Template</label>
                  <span style={{ fontSize: '0.72rem', color: 'hsl(var(--color-text-muted))' }}>Insert tags:</span>
                </div>
                <div style={{ display: 'flex', gap: '0.4rem', marginBottom: '0.5rem', flexWrap: 'wrap' }}>
                  {['{{name}}', '{{clinic_name}}', '{{phone}}'].map(v => (
                    <button
                      key={v}
                      type="button"
                      onClick={() => setEditTemplate(prev => `${prev} ${v}`)}
                      style={{
                        padding: '0.2rem 0.5rem',
                        borderRadius: 4,
                        fontSize: '0.72rem',
                        background: 'hsl(var(--color-surface-2))',
                        border: '1px solid hsl(var(--color-border))',
                        color: 'hsl(var(--color-primary-glow))',
                        cursor: 'pointer',
                      }}
                    >
                      + {v}
                    </button>
                  ))}
                </div>
                <textarea
                  required
                  rows={4}
                  value={editTemplate}
                  onChange={e => setEditTemplate(e.target.value)}
                  className="input"
                  style={{ width: '100%', fontFamily: 'inherit', resize: 'vertical' }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: '0.35rem' }}>
                    AI Qualification Threshold (Seconds)
                  </label>
                  <input
                    type="number"
                    min={5}
                    max={600}
                    value={editThreshold}
                    onChange={e => setEditThreshold(Number(e.target.value))}
                    className="input"
                    style={{ width: '100%' }}
                  />
                  <span style={{ fontSize: '0.7rem', color: 'hsl(var(--color-text-muted))' }}>
                    ≤ {editThreshold}s = Bot. &gt; {editThreshold}s = Manual.
                  </span>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: '0.35rem' }}>
                    Safe Delay Between Sends (Seconds)
                  </label>
                  <input
                    type="number"
                    min={2}
                    max={60}
                    value={editDelay}
                    onChange={e => setEditDelay(Number(e.target.value))}
                    className="input"
                    style={{ width: '100%' }}
                  />
                  <span style={{ fontSize: '0.7rem', color: 'hsl(var(--color-text-muted))' }}>
                    Recommended: 5 to 10 seconds.
                  </span>
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1rem' }}>
                <button type="button" onClick={() => setShowSettingsModal(false)} className="btn btn-outline">
                  Cancel
                </button>
                <button type="submit" disabled={submittingSettings} className="btn btn-primary">
                  {submittingSettings ? 'Saving...' : 'Save Settings'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 4: Test Send */}
      {showTestModal && selectedCampaign && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.7)',
            backdropFilter: 'blur(4px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999,
            padding: '1rem',
          }}
        >
          <div className="card" style={{ maxWidth: 500, width: '100%', padding: '1.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <h3 style={{ fontSize: '1.2rem', fontWeight: 800 }}>🧪 Send Test WhatsApp Message</h3>
              <button
                onClick={() => setShowTestModal(false)}
                style={{ background: 'none', border: 'none', color: 'hsl(var(--color-text-muted))', cursor: 'pointer', fontSize: '1.2rem' }}
              >
                ✕
              </button>
            </div>

            <p style={{ fontSize: '0.78rem', color: 'hsl(var(--color-text-muted))', marginBottom: '1rem' }}>
              Verify how the outreach message looks and test delivery to your personal phone before running the campaign.
            </p>

            <form onSubmit={handleTestSend} style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: '0.35rem' }}>
                  Your WhatsApp Number *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. 919876543210"
                  value={testPhone}
                  onChange={e => setTestPhone(e.target.value)}
                  className="input"
                  style={{ width: '100%' }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: '0.35rem' }}>
                    Sample Name
                  </label>
                  <input
                    type="text"
                    value={testName}
                    onChange={e => setTestName(e.target.value)}
                    className="input"
                    style={{ width: '100%' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: '0.35rem' }}>
                    Sample Clinic Name
                  </label>
                  <input
                    type="text"
                    value={testClinic}
                    onChange={e => setTestClinic(e.target.value)}
                    className="input"
                    style={{ width: '100%' }}
                  />
                </div>
              </div>

              {/* Preview Box */}
              <div
                style={{
                  padding: '0.75rem',
                  borderRadius: 6,
                  background: 'hsl(var(--color-surface-2))',
                  border: '1px solid hsl(var(--color-border))',
                  fontSize: '0.75rem',
                  marginTop: '0.25rem',
                }}
              >
                <strong style={{ display: 'block', marginBottom: '0.25rem', color: 'hsl(var(--color-primary-glow))' }}>
                  Preview:
                </strong>
                <p style={{ margin: 0, color: 'hsl(var(--color-text-secondary))', fontStyle: 'italic' }}>
                  &ldquo;
                  {selectedCampaign.messageTemplate
                    .replace(/\{\{\s*name\s*\}\}/gi, testName || 'Doctor')
                    .replace(/\{\{\s*clinic_name\s*\}\}/gi, testClinic || 'Dental Clinic')
                    .replace(/\{\{\s*clinic\s*\}\}/gi, testClinic || 'Dental Clinic')
                    .replace(/\{\{\s*phone\s*\}\}/gi, testPhone || '919876543210')}
                  &rdquo;
                </p>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1rem' }}>
                <button type="button" onClick={() => setShowTestModal(false)} className="btn btn-outline">
                  Cancel
                </button>
                <button type="submit" disabled={submittingTest} className="btn btn-secondary">
                  {submittingTest ? 'Sending...' : 'Dispatch Test Message 📤'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
