'use client';

// src/app/admin/campaigns/page.tsx
// WhatsApp Cold Outreach Campaign Manager & Real-Time AI Qualification Console
// Redesigned with Cinematic Obsidian × Phoenix Ember Design System

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
          setCampaigns(prev => prev.map(c => c.id === campaignId ? json.data.campaign : c));
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
  }, [selectedCampaign]);

  // Create Campaign Handler
  const handleCreateCampaign = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCampaignName.trim()) return;

    setSubmittingCreate(true);
    setStatusMessage(null);

    try {
      const res = await fetch('/api/v1/admin/campaigns', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newCampaignName.trim(),
          organizationId: newCampaignOrgId || null,
          messageTemplate: newCampaignTemplate,
          responseThresholdSeconds: newCampaignThreshold,
          delaySeconds: newCampaignDelay,
        }),
      });

      const json = await res.json();
      if (!res.ok) throw new Error(json.error?.message || 'Failed to create campaign');

      setStatusMessage({ type: 'success', text: `Campaign "${newCampaignName}" created successfully!` });
      setShowCreateModal(false);
      setNewCampaignName('');
      await loadCampaigns();
      if (json.data?.id) setSelectedCampaignId(json.data.id);
    } catch (e: any) {
      console.error(e);
      setStatusMessage({ type: 'error', text: e.message || 'Error creating campaign' });
    } finally {
      setSubmittingCreate(false);
    }
  };

  // Add Leads Handler
  const handleAddLeads = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCampaignId) return;

    setSubmittingLeads(true);
    setStatusMessage(null);

    try {
      const leadsPayload = [];

      if (addMode === 'bulk') {
        const lines = rawLeadsText.split('\n');
        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed) continue;
          const parts = trimmed.split(',').map(p => p.trim());
          const phone = parts[0]?.replace(/[^0-9]/g, '');
          const name = parts[1] || 'Doctor';
          const clinicName = parts[2] || 'Clinic';

          if (phone && phone.length >= 8) {
            leadsPayload.push({ phone, name, clinicName });
          }
        }
      } else {
        const cleanPhone = singleLeadPhone.replace(/[^0-9]/g, '');
        if (cleanPhone) {
          leadsPayload.push({
            phone: cleanPhone,
            name: singleLeadName.trim() || 'Doctor',
            clinicName: singleClinicName.trim() || 'Clinic',
          });
        }
      }

      if (leadsPayload.length === 0) {
        throw new Error('No valid leads detected. Ensure phone numbers have at least 8 digits.');
      }

      const res = await fetch(`/api/v1/admin/campaigns/${selectedCampaignId}/leads`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ leads: leadsPayload }),
      });

      const json = await res.json();
      if (!res.ok) throw new Error(json.error?.message || 'Failed to add leads');

      setStatusMessage({
        type: 'success',
        text: `Successfully imported ${json.data?.insertedCount || leadsPayload.length} lead(s)!`,
      });
      setShowAddLeadsModal(false);
      setRawLeadsText('');
      setSingleLeadPhone('');
      setSingleLeadName('');
      setSingleClinicName('');
      loadCampaignDetails(selectedCampaignId);
      loadCampaigns(true);
    } catch (e: any) {
      console.error(e);
      setStatusMessage({ type: 'error', text: e.message || 'Error adding leads' });
    } finally {
      setSubmittingLeads(false);
    }
  };

  // Save Settings Handler
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
          messageTemplate: editTemplate,
          responseThresholdSeconds: editThreshold,
          delaySeconds: editDelay,
        }),
      });

      const json = await res.json();
      if (!res.ok) throw new Error(json.error?.message || 'Failed to update campaign');

      setStatusMessage({ type: 'success', text: 'Campaign settings saved successfully!' });
      setShowSettingsModal(false);
      loadCampaignDetails(selectedCampaignId);
    } catch (e: any) {
      console.error(e);
      setStatusMessage({ type: 'error', text: e.message || 'Error updating settings' });
    } finally {
      setSubmittingSettings(false);
    }
  };

  // Test Send Message Handler
  const handleTestSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCampaign || !testPhone.trim()) return;

    setSubmittingTest(true);
    setStatusMessage(null);

    try {
      const cleanPhone = testPhone.replace(/[^0-9]/g, '');
      const testMsg = selectedCampaign.messageTemplate
        .replace(/\{\{\s*name\s*\}\}/gi, testName || 'Doctor')
        .replace(/\{\{\s*clinic_name\s*\}\}/gi, testClinic || 'Dental Clinic')
        .replace(/\{\{\s*clinic\s*\}\}/gi, testClinic || 'Dental Clinic')
        .replace(/\{\{\s*phone\s*\}\}/gi, cleanPhone);

      const res = await fetch('/api/v1/admin/campaigns/test-send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phone: cleanPhone,
          message: testMsg,
          organizationId: selectedCampaign.organizationId,
        }),
      });

      const json = await res.json();
      if (!res.ok) throw new Error(json.error?.message || 'Failed to dispatch test message');

      setStatusMessage({ type: 'success', text: `Test message dispatched to +${cleanPhone}!` });
      setShowTestModal(false);
    } catch (e: any) {
      console.error(e);
      setStatusMessage({ type: 'error', text: e.message || 'Error sending test message' });
    } finally {
      setSubmittingTest(false);
    }
  };

  // Campaign Action Controller (Start / Pause / Reset)
  const handleCampaignAction = async (action: 'start' | 'pause' | 'reset') => {
    if (!selectedCampaignId) return;

    setActionInProgress(action);
    setStatusMessage(null);

    try {
      const res = await fetch(`/api/v1/admin/campaigns/${selectedCampaignId}/action`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action }),
      });

      const json = await res.json();
      if (!res.ok) throw new Error(json.error?.message || `Failed to ${action} campaign`);

      setStatusMessage({
        type: 'success',
        text: json.data?.message || `Campaign ${action === 'start' ? 'started' : action === 'pause' ? 'paused' : 'reset'}!`,
      });

      loadCampaignDetails(selectedCampaignId);
      loadCampaigns(true);
    } catch (e: any) {
      console.error(e);
      setStatusMessage({ type: 'error', text: e.message || `Error executing ${action}` });
    } finally {
      setActionInProgress(null);
    }
  };

  // Delete Campaign
  const handleDeleteCampaign = async () => {
    if (!selectedCampaignId || !confirm(`Are you sure you want to delete campaign "${selectedCampaign?.name}" and all its leads?`)) {
      return;
    }

    try {
      const res = await fetch(`/api/v1/admin/campaigns/${selectedCampaignId}`, {
        method: 'DELETE',
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error?.message || 'Failed to delete campaign');

      setStatusMessage({ type: 'success', text: 'Campaign deleted.' });
      setSelectedCampaignId(null);
      loadCampaigns();
    } catch (e: any) {
      console.error(e);
      setStatusMessage({ type: 'error', text: e.message || 'Error deleting campaign' });
    }
  };

  // Delete individual lead
  const handleDeleteLead = async (leadId: string) => {
    if (!selectedCampaignId) return;

    try {
      const res = await fetch(`/api/v1/admin/campaigns/${selectedCampaignId}/leads?leadId=${leadId}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        setLeads(prev => prev.filter(l => l.id !== leadId));
        loadCampaigns(true);
      }
    } catch (e) {
      console.error('Failed to delete lead:', e);
    }
  };

  // Export CSV Handler
  const handleExportCSV = () => {
    if (!selectedCampaign || leads.length === 0) return;

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
    <div className="space-y-6 animate-fade-in pb-12">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-[#F3F0E8]/08 pb-6">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-[#E84B2C] shadow-[0_0_8px_#E84B2C]" />
            <span className="text-[11px] font-mono tracking-widest text-[#E87A38] uppercase">
              Cold Lead Qualification Engine
            </span>
          </div>
          <h1 className="font-heading text-2xl sm:text-3xl font-semibold tracking-tight text-[#F3F0E8]">
            Outreach &amp; AI Qualification
          </h1>
          <p className="text-sm text-[#9E9B93] mt-1 max-w-2xl">
            WhatsApp outreach with latency tracking down to the second to classify clinics with <strong className="text-[#63C7A2]">Manual Receptionists (Hot Sales Leads)</strong> vs. <strong className="text-[#D4AF37]">Existing AI Bots</strong>.
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          <button
            onClick={() => {
              loadCampaigns();
              if (selectedCampaignId) loadCampaignDetails(selectedCampaignId);
            }}
            className="btn btn-secondary text-xs"
          >
            🔄 Refresh
          </button>

          {selectedCampaign && leads.length > 0 && (
            <button
              onClick={handleExportCSV}
              className="btn btn-secondary text-xs"
            >
              📥 Export CSV
            </button>
          )}

          {selectedCampaign && (
            <button
              onClick={() => setShowTestModal(true)}
              className="btn btn-secondary text-xs"
            >
              🧪 Test Send
            </button>
          )}

          <button
            onClick={() => setShowCreateModal(true)}
            className="btn btn-primary text-xs"
          >
            + New Campaign
          </button>
        </div>
      </div>

      {/* Global Status Banner */}
      {statusMessage && (
        <div className={`p-4 rounded-xl text-xs flex items-center justify-between border ${
          statusMessage.type === 'success'
            ? 'bg-[#63C7A2]/10 border-[#63C7A2]/30 text-[#63C7A2]'
            : statusMessage.type === 'error'
            ? 'bg-[#E84B2C]/10 border-[#E84B2C]/30 text-[#E84B2C]'
            : 'bg-[#E87A38]/10 border-[#E87A38]/30 text-[#E87A38]'
        }`}>
          <span>{statusMessage.text}</span>
          <button
            onClick={() => setStatusMessage(null)}
            className="text-inherit hover:opacity-75 transition-opacity text-sm ml-2"
          >
            ✕
          </button>
        </div>
      )}

      {/* WhatsApp Sender Status Banner */}
      <div className="card p-4 bg-[#171614] border border-[#F3F0E8]/08 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#1C1916] border border-[#F3F0E8]/10 flex items-center justify-center text-lg text-[#63C7A2]">
            💬
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-semibold text-xs text-[#F3F0E8]">WhatsApp Outbound Dispatch Line</span>
              {activeSender?.status === 'connected' ? (
                <span className="badge badge-success text-[10px]">● Connected</span>
              ) : (
                <span className="badge badge-warning text-[10px]">Disconnected</span>
              )}
            </div>
            <div className="text-[11px] text-[#9E9B93] mt-0.5 font-mono">
              {activeSender?.phoneNumber ? (
                <span>Outbound node: <strong className="text-[#D0CBC1]">+{activeSender.phoneNumber}</strong> ({activeSender.clinicName})</span>
              ) : (
                <span>No phone number registered yet. Connect WhatsApp in clinic settings.</span>
              )}
            </div>
          </div>
        </div>

        <Link
          href="/dashboard/onboarding"
          className="btn btn-secondary text-xs px-3 py-1.5"
        >
          Manage Connection →
        </Link>
      </div>

      {/* Campaign Selector / Switcher */}
      {campaigns.length > 0 ? (
        <div>
          <div className="text-xs font-mono text-[#9E9B93] mb-2 uppercase tracking-wider">Active Campaigns</div>
          <div className="flex gap-3 overflow-x-auto pb-2">
            {campaigns.map(camp => {
              const isSelected = camp.id === selectedCampaignId;
              const isRunning = camp.status === 'running';
              return (
                <button
                  key={camp.id}
                  onClick={() => setSelectedCampaignId(camp.id)}
                  className={`p-3.5 rounded-xl text-left transition-all min-w-[220px] shrink-0 border ${
                    isSelected
                      ? 'bg-[#1C1916] border-[#E84B2C] shadow-[0_0_12px_rgba(232,75,44,0.15)]'
                      : 'bg-[#171614] border-[#F3F0E8]/08 hover:border-[#F3F0E8]/16'
                  }`}
                >
                  <div className="flex justify-between items-center mb-1">
                    <span className={`font-semibold text-xs truncate mr-2 ${isSelected ? 'text-[#E87A38]' : 'text-[#F3F0E8]'}`}>
                      {camp.name}
                    </span>
                    <span className={`badge text-[9px] font-mono uppercase ${
                      isRunning ? 'badge-success' : camp.status === 'paused' ? 'badge-warning' : 'badge-neutral'
                    }`}>
                      {isRunning ? '● RUNNING' : camp.status}
                    </span>
                  </div>
                  <div className="text-[11px] font-mono text-[#9E9B93]">
                    {camp.stats.totalLeads} leads • {camp.stats.repliedCount} replies
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      ) : (
        <div className="card p-12 text-center">
          <div className="text-3xl mb-2">✦</div>
          <h2 className="font-heading text-lg font-semibold text-[#F3F0E8] mb-1">
            No Active Campaigns Found
          </h2>
          <p className="text-xs text-[#9E9B93] max-w-md mx-auto mb-5 leading-relaxed">
            Create your first cold outreach campaign to ingest clinic leads, deploy templated WhatsApp checks, and automatically classify manual receptionists.
          </p>
          <button onClick={() => setShowCreateModal(true)} className="btn btn-primary text-xs">
            Create First Campaign
          </button>
        </div>
      )}

      {/* Selected Campaign Active Console */}
      {selectedCampaign && (
        <>
          {/* Action Control Bar */}
          <div className="card p-5 bg-[#171614] border border-[#F3F0E8]/12 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <div className="flex items-center gap-2.5 mb-1">
                <h2 className="font-heading text-lg font-semibold text-[#F3F0E8]">
                  {selectedCampaign.name}
                </h2>
                <span className={`badge text-[10px] font-mono uppercase ${
                  selectedCampaign.status === 'running'
                    ? 'badge-success'
                    : selectedCampaign.status === 'paused'
                    ? 'badge-warning'
                    : 'badge-neutral'
                }`}>
                  {selectedCampaign.status === 'running' ? '● RUNNING IN BACKGROUND' : selectedCampaign.status}
                </span>
              </div>
              <div className="text-xs font-mono text-[#9E9B93] flex items-center gap-2 flex-wrap">
                <span>Threshold: <strong className="text-[#D0CBC1]">≤{selectedCampaign.responseThresholdSeconds}s Bot</strong></span>
                <span>•</span>
                <span>Throttle: <strong className="text-[#D0CBC1]">{selectedCampaign.delaySeconds}s delay</strong></span>
                <span>•</span>
                <span>Created {new Date(selectedCampaign.createdAt).toLocaleDateString()}</span>
              </div>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              <button
                onClick={() => setShowAddLeadsModal(true)}
                className="btn btn-secondary text-xs"
              >
                + Add Leads
              </button>

              <button
                onClick={() => setShowSettingsModal(true)}
                className="btn btn-secondary text-xs"
              >
                ⚙️ Settings
              </button>

              {selectedCampaign.status !== 'running' ? (
                <button
                  onClick={() => handleCampaignAction('start')}
                  disabled={actionInProgress === 'start' || selectedCampaign.stats.pendingCount === 0}
                  className="btn btn-primary text-xs"
                >
                  {actionInProgress === 'start' ? 'Starting...' : '▶ Start Dispatch'}
                </button>
              ) : (
                <button
                  onClick={() => handleCampaignAction('pause')}
                  disabled={actionInProgress === 'pause'}
                  className="btn btn-secondary text-xs text-[#E87A38]"
                >
                  {actionInProgress === 'pause' ? 'Pausing...' : '⏸ Pause Dispatch'}
                </button>
              )}

              <button
                onClick={() => {
                  if (confirm('Reset all leads to Pending to re-run dispatch?')) {
                    handleCampaignAction('reset');
                  }
                }}
                disabled={actionInProgress === 'reset'}
                className="btn btn-secondary text-xs font-mono"
                title="Reset lead statuses"
              >
                Reset
              </button>

              <button
                onClick={handleDeleteCampaign}
                className="text-xs font-mono text-[#E84B2C] hover:underline px-2"
                title="Delete Campaign"
              >
                Delete
              </button>
            </div>
          </div>

          {/* KPI Stat Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-6 gap-3" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '0.75rem' }}>
            <div className="card p-3.5">
              <div className="text-[10px] font-mono uppercase text-[#9E9B93]">Total Leads</div>
              <div className="font-mono text-2xl font-bold text-[#F3F0E8] mt-1">{selectedCampaign.stats.totalLeads}</div>
              <div className="text-[10px] font-mono text-[#9E9B93] mt-0.5">{selectedCampaign.stats.pendingCount} queued</div>
            </div>

            <div className="card p-3.5">
              <div className="text-[10px] font-mono uppercase text-[#9E9B93]">Dispatched</div>
              <div className="font-mono text-2xl font-bold text-[#E87A38] mt-1">{selectedCampaign.stats.sentCount}</div>
              <div className="text-[10px] font-mono text-[#9E9B93] mt-0.5">
                {selectedCampaign.stats.totalLeads > 0
                  ? `${Math.round((selectedCampaign.stats.sentCount / selectedCampaign.stats.totalLeads) * 100)}% sent`
                  : '0%'}
              </div>
            </div>

            <div className="card p-3.5">
              <div className="text-[10px] font-mono uppercase text-[#9E9B93]">Replies</div>
              <div className="font-mono text-2xl font-bold text-[#F3F0E8] mt-1">{selectedCampaign.stats.repliedCount}</div>
              <div className="text-[10px] font-mono text-[#9E9B93] mt-0.5">
                {selectedCampaign.stats.sentCount > 0
                  ? `${Math.round((selectedCampaign.stats.repliedCount / selectedCampaign.stats.sentCount) * 100)}% reply rate`
                  : 'Awaiting'}
              </div>
            </div>

            <div className="card p-3.5 border-[#63C7A2]/40 bg-[#171614] shadow-[0_0_12px_rgba(99,199,162,0.1)]">
              <div className="text-[10px] font-mono uppercase text-[#63C7A2]">Hot Leads (Manual)</div>
              <div className="font-mono text-2xl font-bold text-[#63C7A2] mt-1">
                🎯 {selectedCampaign.stats.noAiManualCount}
              </div>
              <div className="text-[10px] font-mono text-[#9E9B93] mt-0.5">Prime pitch targets</div>
            </div>

            <div className="card p-3.5 border-[#D4AF37]/30 bg-[#171614]">
              <div className="text-[10px] font-mono uppercase text-[#D4AF37]">Has AI Automation</div>
              <div className="font-mono text-2xl font-bold text-[#D4AF37] mt-1">
                🤖 {selectedCampaign.stats.hasAiCount}
              </div>
              <div className="text-[10px] font-mono text-[#9E9B93] mt-0.5">Replied in ≤{selectedCampaign.responseThresholdSeconds}s</div>
            </div>

            <div className="card p-3.5">
              <div className="text-[10px] font-mono uppercase text-[#9E9B93]">Avg Latency</div>
              <div className="font-mono text-2xl font-bold text-[#E87A38] mt-1">
                {selectedCampaign.stats.avgResponseTimeSeconds != null
                  ? `${selectedCampaign.stats.avgResponseTimeSeconds}s`
                  : '—'}
              </div>
              <div className="text-[10px] font-mono text-[#9E9B93] mt-0.5">Across all replies</div>
            </div>
          </div>

          {/* Qualification Logic Explainer Banner */}
          <div className="p-4 rounded-xl bg-[#111110] border border-[#F3F0E8]/08 flex items-start gap-3 text-xs leading-relaxed">
            <span className="text-base text-[#E87A38]">💡</span>
            <div className="text-[#9E9B93]">
              <strong className="text-[#F3F0E8]">Lead Qualification Logic:</strong>{' '}
              When a clinic replies, we measure the elapsed seconds from dispatch.
              Replies within <strong className="text-[#D4AF37]">≤ {selectedCampaign.responseThresholdSeconds}s</strong> are classified as <span className="text-[#D4AF37] font-mono text-[11px]">🤖 HAS AI BOT</span>.
              Replies taking <strong className="text-[#63C7A2]">&gt; {selectedCampaign.responseThresholdSeconds}s</strong> are qualified as <span className="text-[#63C7A2] font-mono text-[11px]">🎯 NO AI (MANUAL FRONT DESK)</span> — these clinics are your <strong>highest-value sales opportunities</strong>.
            </div>
          </div>

          {/* Leads Table Card */}
          <div className="card p-0 overflow-hidden">
            {/* Table Filters & Search */}
            <div className="p-4 border-b border-[#F3F0E8]/08 flex flex-col md:flex-row justify-between items-stretch md:items-center gap-3">
              <div className="flex gap-1.5 flex-wrap">
                {[
                  { id: 'all', label: `All (${leads.length})` },
                  { id: 'no_ai_manual', label: `🎯 Hot (${selectedCampaign.stats.noAiManualCount})`, color: '#63C7A2' },
                  { id: 'has_ai', label: `🤖 Has AI (${selectedCampaign.stats.hasAiCount})`, color: '#D4AF37' },
                  { id: 'sent', label: `⏳ Sent (${selectedCampaign.stats.sentCount - selectedCampaign.stats.repliedCount})` },
                  { id: 'pending', label: `Pending (${selectedCampaign.stats.pendingCount})` },
                ].map(tab => {
                  const isActive = activeTab === tab.id;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id as any)}
                      className={`px-3 py-1.5 rounded-full text-xs font-mono transition-all ${
                        isActive
                          ? 'bg-[#E84B2C] text-[#F3F0E8] shadow-[0_0_8px_rgba(232,75,44,0.3)]'
                          : 'bg-[#111110] text-[#9E9B93] border border-[#F3F0E8]/08 hover:border-[#F3F0E8]/16'
                      }`}
                    >
                      {tab.label}
                    </button>
                  );
                })}
              </div>

              <div className="relative min-w-[240px]">
                <input
                  type="text"
                  placeholder="Search phone, doctor, clinic..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="input text-xs w-full pl-3 pr-8"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-[#9E9B93] hover:text-[#F3F0E8]"
                  >
                    ✕
                  </button>
                )}
              </div>
            </div>

            {/* Table */}
            {leadsLoading ? (
              <div className="text-center py-12 text-xs text-[#9E9B93]">
                Querying campaign leads...
              </div>
            ) : filteredLeads.length === 0 ? (
              <div className="text-center py-12 text-[#9E9B93]">
                <div className="text-2xl mb-1">📭</div>
                <div className="text-xs font-medium text-[#F3F0E8]">No leads match current filter</div>
                {leads.length === 0 && (
                  <button
                    onClick={() => setShowAddLeadsModal(true)}
                    className="btn btn-secondary text-xs mt-3"
                  >
                    + Import Leads Now
                  </button>
                )}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Lead &amp; Clinic</th>
                      <th>WhatsApp Line</th>
                      <th>Dispatch State</th>
                      <th>AI Qualification</th>
                      <th>Response Latency</th>
                      <th>Incoming Reply</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredLeads.map(lead => {
                      const isNoAi = lead.qualificationStatus === 'no_ai_manual';
                      const isHasAi = lead.qualificationStatus === 'has_ai';

                      return (
                        <tr
                          key={lead.id}
                          className={`hover:bg-[#F3F0E8]/03 transition-colors ${
                            isNoAi ? 'bg-[#63C7A2]/03' : isHasAi ? 'bg-[#D4AF37]/03' : ''
                          }`}
                        >
                          <td>
                            <div className="font-medium text-xs text-[#F3F0E8]">{lead.name}</div>
                            <div className="text-[11px] font-mono text-[#9E9B93]">{lead.clinicName}</div>
                          </td>

                          <td>
                            <div className="flex items-center gap-1.5 font-mono text-xs">
                              <span>+{lead.phone}</span>
                              <a
                                href={`https://wa.me/${lead.phone}`}
                                target="_blank"
                                rel="noreferrer"
                                title="Open WhatsApp Chat"
                                className="text-[#63C7A2] hover:underline text-[10px]"
                              >
                                ↗
                              </a>
                            </div>
                          </td>

                          <td>
                            <span className={`badge ${
                              lead.status === 'replied'
                                ? 'badge-success'
                                : lead.status === 'sent'
                                ? 'badge-warning'
                                : lead.status === 'sending'
                                ? 'badge-neutral'
                                : lead.status === 'failed'
                                ? 'badge-danger'
                                : 'badge-neutral'
                            }`}>
                              {lead.status}
                            </span>
                          </td>

                          <td>
                            {isNoAi && (
                              <span className="badge bg-[#63C7A2]/15 border border-[#63C7A2]/30 text-[#63C7A2] font-mono text-[10px]">
                                🎯 NO AI (MANUAL)
                              </span>
                            )}
                            {isHasAi && (
                              <span className="badge bg-[#D4AF37]/15 border border-[#D4AF37]/30 text-[#D4AF37] font-mono text-[10px]">
                                🤖 HAS AI BOT
                              </span>
                            )}
                            {!isNoAi && !isHasAi && (
                              <span className="text-[11px] font-mono text-[#9E9B93]">
                                {lead.status === 'sent' ? '⏳ Awaiting' : '—'}
                              </span>
                            )}
                          </td>

                          <td>
                            {lead.responseTimeSeconds != null ? (
                              <span className={`font-mono text-xs font-semibold ${
                                isNoAi ? 'text-[#63C7A2]' : 'text-[#D4AF37]'
                              }`}>
                                {lead.responseTimeSeconds < 60
                                  ? `${lead.responseTimeSeconds}s`
                                  : `${Math.floor(lead.responseTimeSeconds / 60)}m ${lead.responseTimeSeconds % 60}s`}
                              </span>
                            ) : (
                              <span className="text-xs font-mono text-[#9E9B93]">—</span>
                            )}
                          </td>

                          <td className="max-w-xs">
                            {lead.replyText ? (
                              <div
                                className="p-1.5 rounded-lg bg-[#111110] border border-[#F3F0E8]/08 text-xs text-[#D0CBC1] truncate font-mono"
                                title={lead.replyText}
                              >
                                &ldquo;{lead.replyText}&rdquo;
                              </div>
                            ) : (
                              <span className="text-xs text-[#9E9B93] italic">No reply yet</span>
                            )}
                          </td>

                          <td>
                            <button
                              onClick={() => handleDeleteLead(lead.id)}
                              className="text-[#E84B2C] hover:text-[#E87A38] text-xs p-1"
                              title="Delete Lead"
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
        <div className="fixed inset-0 bg-[#080505]/85 backdrop-blur-md flex items-center justify-center z-50 p-4 animate-fade-in">
          <div className="card max-w-lg w-full max-h-[90vh] overflow-y-auto p-6 bg-[#171614] border border-[#F3F0E8]/12 shadow-[0_20px_50px_rgba(0,0,0,0.8)] animate-scale-in">
            <div className="flex justify-between items-center mb-5 pb-3 border-b border-[#F3F0E8]/08">
              <h3 className="font-heading text-lg font-semibold text-[#F3F0E8]">Create Outreach Campaign</h3>
              <button
                onClick={() => setShowCreateModal(false)}
                className="text-[#9E9B93] hover:text-[#F3F0E8] text-lg p-1"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateCampaign} className="space-y-4">
              <div>
                <label className="label text-xs">Campaign Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Mumbai Dental Practices — Cohort A"
                  value={newCampaignName}
                  onChange={e => setNewCampaignName(e.target.value)}
                  className="input text-xs"
                />
              </div>

              <div>
                <label className="label text-xs">WhatsApp Dispatch Line</label>
                <select
                  value={newCampaignOrgId}
                  onChange={e => setNewCampaignOrgId(e.target.value)}
                  className="input text-xs"
                >
                  {senders.length > 0 ? (
                    senders.map(s => (
                      <option key={s.organizationId} value={s.organizationId}>
                        {s.clinicName} ({s.phoneNumber || 'Connected'}) [{s.status}]
                      </option>
                    ))
                  ) : (
                    <option value="default">Default WhatsApp Node</option>
                  )}
                </select>
              </div>

              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="label text-xs">Message Template *</label>
                  <span className="text-[10px] text-[#9E9B93] font-mono">Insert variables:</span>
                </div>
                <div className="flex gap-1.5 mb-2 flex-wrap">
                  {['{{name}}', '{{clinic_name}}', '{{phone}}'].map(v => (
                    <button
                      key={v}
                      type="button"
                      onClick={() => setNewCampaignTemplate(prev => `${prev} ${v}`)}
                      className="px-2 py-0.5 rounded text-[10px] font-mono bg-[#111110] border border-[#F3F0E8]/10 text-[#E87A38] hover:border-[#E87A38]"
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
                  className="input text-xs font-body resize-y"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label text-[11px]">AI Qualification Threshold (s)</label>
                  <input
                    type="number"
                    min={5}
                    max={600}
                    value={newCampaignThreshold}
                    onChange={e => setNewCampaignThreshold(Number(e.target.value))}
                    className="input text-xs font-mono"
                  />
                  <span className="text-[10px] text-[#9E9B93]">≤ {newCampaignThreshold}s = Bot</span>
                </div>

                <div>
                  <label className="label text-[11px]">Safe Dispatch Delay (s)</label>
                  <input
                    type="number"
                    min={2}
                    max={60}
                    value={newCampaignDelay}
                    onChange={e => setNewCampaignDelay(Number(e.target.value))}
                    className="input text-xs font-mono"
                  />
                  <span className="text-[10px] text-[#9E9B93]">Pause between texts</span>
                </div>
              </div>

              <div className="flex justify-end gap-2.5 pt-2">
                <button type="button" onClick={() => setShowCreateModal(false)} className="btn btn-secondary text-xs">
                  Cancel
                </button>
                <button type="submit" disabled={submittingCreate} className="btn btn-primary text-xs">
                  {submittingCreate ? 'Creating...' : 'Create Campaign'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: Add Leads */}
      {showAddLeadsModal && selectedCampaign && (
        <div className="fixed inset-0 bg-[#080505]/85 backdrop-blur-md flex items-center justify-center z-50 p-4 animate-fade-in">
          <div className="card max-w-lg w-full max-h-[90vh] overflow-y-auto p-6 bg-[#171614] border border-[#F3F0E8]/12 shadow-[0_20px_50px_rgba(0,0,0,0.8)] animate-scale-in">
            <div className="flex justify-between items-center mb-4 pb-3 border-b border-[#F3F0E8]/08">
              <div>
                <h3 className="font-heading text-lg font-semibold text-[#F3F0E8]">
                  Import Leads to &ldquo;{selectedCampaign.name}&rdquo;
                </h3>
                <p className="text-xs text-[#9E9B93]">Import WhatsApp phone numbers for automated auditing.</p>
              </div>
              <button
                onClick={() => setShowAddLeadsModal(false)}
                className="text-[#9E9B93] hover:text-[#F3F0E8] text-lg p-1"
              >
                ✕
              </button>
            </div>

            <div className="flex gap-2 mb-4">
              <button
                type="button"
                onClick={() => setAddMode('bulk')}
                className={`btn text-xs px-3 py-1.5 ${addMode === 'bulk' ? 'btn-primary' : 'btn-secondary'}`}
              >
                📋 Bulk Paste / CSV
              </button>
              <button
                type="button"
                onClick={() => setAddMode('single')}
                className={`btn text-xs px-3 py-1.5 ${addMode === 'single' ? 'btn-primary' : 'btn-secondary'}`}
              >
                👤 Single Practice
              </button>
            </div>

            <form onSubmit={handleAddLeads} className="space-y-4">
              {addMode === 'bulk' ? (
                <div>
                  <div className="flex justify-between items-center mb-1">
                    <label className="label text-xs">Paste Leads (One per line)</label>
                    <span className="text-[11px] font-mono text-[#E87A38]">
                      {bulkLeadCount} lead(s) detected
                    </span>
                  </div>
                  <div className="text-[11px] text-[#9E9B93] mb-2 font-mono">
                    Format: 919876543210, Dr. Rajesh, Apex Clinic
                  </div>
                  <textarea
                    required
                    rows={8}
                    placeholder={`919876543210, Dr. Rajesh, Apex Dental Clinic\n919812345678, Dr. Priya, Smile Care\n919899887766`}
                    value={rawLeadsText}
                    onChange={e => setRawLeadsText(e.target.value)}
                    className="input text-xs font-mono resize-y"
                  />
                </div>
              ) : (
                <div className="space-y-3">
                  <div>
                    <label className="label text-xs">WhatsApp Phone Number *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. 919876543210"
                      value={singleLeadPhone}
                      onChange={e => setSingleLeadPhone(e.target.value)}
                      className="input text-xs font-mono"
                    />
                  </div>
                  <div>
                    <label className="label text-xs">Lead / Doctor Name</label>
                    <input
                      type="text"
                      placeholder="e.g. Dr. Rajesh Sharma"
                      value={singleLeadName}
                      onChange={e => setSingleLeadName(e.target.value)}
                      className="input text-xs"
                    />
                  </div>
                  <div>
                    <label className="label text-xs">Clinic / Business Name</label>
                    <input
                      type="text"
                      placeholder="e.g. Apex Multispeciality Dental"
                      value={singleClinicName}
                      onChange={e => setSingleClinicName(e.target.value)}
                      className="input text-xs"
                    />
                  </div>
                </div>
              )}

              <div className="flex justify-end gap-2.5 pt-2">
                <button type="button" onClick={() => setShowAddLeadsModal(false)} className="btn btn-secondary text-xs">
                  Cancel
                </button>
                <button type="submit" disabled={submittingLeads} className="btn btn-primary text-xs">
                  {submittingLeads ? 'Importing...' : 'Import Leads'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 3: Edit Template & Settings */}
      {showSettingsModal && selectedCampaign && (
        <div className="fixed inset-0 bg-[#080505]/85 backdrop-blur-md flex items-center justify-center z-50 p-4 animate-fade-in">
          <div className="card max-w-lg w-full max-h-[90vh] overflow-y-auto p-6 bg-[#171614] border border-[#F3F0E8]/12 shadow-[0_20px_50px_rgba(0,0,0,0.8)] animate-scale-in">
            <div className="flex justify-between items-center mb-4 pb-3 border-b border-[#F3F0E8]/08">
              <h3 className="font-heading text-lg font-semibold text-[#F3F0E8]">⚙️ Campaign Configuration</h3>
              <button
                onClick={() => setShowSettingsModal(false)}
                className="text-[#9E9B93] hover:text-[#F3F0E8] text-lg p-1"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveSettings} className="space-y-4">
              <div>
                <label className="label text-xs">Message Template</label>
                <textarea
                  required
                  rows={4}
                  value={editTemplate}
                  onChange={e => setEditTemplate(e.target.value)}
                  className="input text-xs resize-y"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label text-[11px]">AI Qualification Threshold (s)</label>
                  <input
                    type="number"
                    min={5}
                    max={600}
                    value={editThreshold}
                    onChange={e => setEditThreshold(Number(e.target.value))}
                    className="input text-xs font-mono"
                  />
                </div>

                <div>
                  <label className="label text-[11px]">Safe Throttle Delay (s)</label>
                  <input
                    type="number"
                    min={2}
                    max={60}
                    value={editDelay}
                    onChange={e => setEditDelay(Number(e.target.value))}
                    className="input text-xs font-mono"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2.5 pt-2">
                <button type="button" onClick={() => setShowSettingsModal(false)} className="btn btn-secondary text-xs">
                  Cancel
                </button>
                <button type="submit" disabled={submittingSettings} className="btn btn-primary text-xs">
                  {submittingSettings ? 'Saving...' : 'Save Configuration'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 4: Test Send */}
      {showTestModal && selectedCampaign && (
        <div className="fixed inset-0 bg-[#080505]/85 backdrop-blur-md flex items-center justify-center z-50 p-4 animate-fade-in">
          <div className="card max-w-md w-full p-6 bg-[#171614] border border-[#F3F0E8]/12 shadow-[0_20px_50px_rgba(0,0,0,0.8)] animate-scale-in">
            <div className="flex justify-between items-center mb-3 pb-3 border-b border-[#F3F0E8]/08">
              <h3 className="font-heading text-lg font-semibold text-[#F3F0E8]">🧪 Test WhatsApp Dispatch</h3>
              <button
                onClick={() => setShowTestModal(false)}
                className="text-[#9E9B93] hover:text-[#F3F0E8] text-lg p-1"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-[#9E9B93] mb-4">
              Send a test outreach message to your personal WhatsApp to verify rendering and variables.
            </p>

            <form onSubmit={handleTestSend} className="space-y-3">
              <div>
                <label className="label text-xs">WhatsApp Number *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. 919876543210"
                  value={testPhone}
                  onChange={e => setTestPhone(e.target.value)}
                  className="input text-xs font-mono"
                />
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="label text-[11px]">Doctor Name</label>
                  <input
                    type="text"
                    value={testName}
                    onChange={e => setTestName(e.target.value)}
                    className="input text-xs"
                  />
                </div>
                <div>
                  <label className="label text-[11px]">Clinic Name</label>
                  <input
                    type="text"
                    value={testClinic}
                    onChange={e => setTestClinic(e.target.value)}
                    className="input text-xs"
                  />
                </div>
              </div>

              <div className="p-3 rounded-xl bg-[#111110] border border-[#F3F0E8]/08 text-xs font-mono text-[#D0CBC1]">
                <span className="text-[#E87A38] block mb-1 font-sans font-semibold">Preview:</span>
                &ldquo;
                {selectedCampaign.messageTemplate
                  .replace(/\{\{\s*name\s*\}\}/gi, testName || 'Doctor')
                  .replace(/\{\{\s*clinic_name\s*\}\}/gi, testClinic || 'Dental Clinic')
                  .replace(/\{\{\s*clinic\s*\}\}/gi, testClinic || 'Dental Clinic')
                  .replace(/\{\{\s*phone\s*\}\}/gi, testPhone || '919876543210')}
                &rdquo;
              </div>

              <div className="flex justify-end gap-2.5 pt-2">
                <button type="button" onClick={() => setShowTestModal(false)} className="btn btn-secondary text-xs">
                  Cancel
                </button>
                <button type="submit" disabled={submittingTest} className="btn btn-primary text-xs">
                  {submittingTest ? 'Sending...' : 'Dispatch Test 📤'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
