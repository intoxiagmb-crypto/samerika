'use client';

import { useState } from 'react';
import { ArrowUpRight, ArrowRight, CalendarDays, ChevronRight, Clock3, FileText, FolderKanban, Plus, Sun, Wallet, Zap, CheckCircle2 } from 'lucide-react';
import SolarLandscape from './solar-landscape';

type Row = Record<string, any>;
type Data = { user: Row; leads: Row[]; projects: Row[]; records: Row[]; notifications: Row[] };
type Props = { data: Data; onNavigate: (view: string) => void; onCreate: () => void; onDetail: (row: Row, type: string) => void };
const money = (amount: number) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(amount / 100);
const dayLabel = (day: string) => new Date(day + 'T12:00:00').toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
const todayKey = () => new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Kolkata', year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date());

export default function PortalOverview({ data, onNavigate, onCreate, onDetail }: Props) {
  const [period, setPeriod] = useState('all');
  const [schedule, setSchedule] = useState('upcoming');
  const agent = data.user.role === 'PARTNER';
  const today = todayKey();
  const active = data.projects.filter(p => !['Completed', 'Cancelled'].includes(p.status));
  const projects = period === 'month' ? data.projects.filter(p => p.created_at.slice(0, 7) === today.slice(0, 7)) : data.projects;
  const completed = data.projects.filter(p => p.status === 'Completed');
  const newLeads = data.leads.filter(l => l.status === 'New');
  const income = data.records.filter(r => agent ? r.kind === 'incentive' && r.status === 'Approved' : r.kind === 'payment').reduce((sum, r) => sum + r.amount, 0);
  const stages = ['Survey', 'Quotation', 'Documentation', 'Approvals', 'Installation', 'Completed'];
  const counts = stages.map(stage => projects.filter(p => p.status === stage).length);
  const maxCount = Math.max(1, ...counts);
  const dates = [
    ...data.leads.filter(l => l.data.followUp && l.status !== 'Converted').map(l => ({ id: l.id, title: l.name, date: l.data.followUp, label: 'Customer follow-up', row: l, type: 'lead' })),
    ...active.filter(p => p.data.dueDate).map(p => ({ id: p.id, title: p.data.name, date: p.data.dueDate, label: 'Target completion', row: p, type: 'project' })),
  ].filter(item => schedule === 'today' ? item.date === today : item.date >= today).sort((a, b) => a.date.localeCompare(b.date));
  const relevantUpdates = data.notifications.slice(0, 3);
  const canAdd = ['ADMIN', 'PARTNER', 'SALES', 'MANAGER', 'CUSTOMER'].includes(data.user.role);

  return <div className="reference-dashboard">
    <div className="overview-center">
      <section className="welcome-card">
        <SolarLandscape className="welcome-landscape"/>
        <div className="welcome-copy">
          <span className="welcome-kicker">{agent ? 'YOUR AGENT WORKSPACE' : data.user.role === 'CUSTOMER' ? 'YOUR SOLAR WORKSPACE' : 'YOUR COMPANY WORKSPACE'}</span>
          <h2>Hello, {data.user.name.split(' ')[0].split('@')[0]} <span className="hello-sun">✦</span></h2>
          <p>{newLeads.length ? <><strong>{newLeads.length} new {newLeads.length === 1 ? 'enquiry' : 'enquiries'}</strong> and <strong>{active.length} active projects.</strong><br/>Small steps. A brighter tomorrow.</> : <>Your next solar opportunity starts here.<br/>Keep every customer and project connected.</>}</p>
          <button className="welcome-link" onClick={() => onNavigate(newLeads.length ? 'leads' : 'projects')}>Review {newLeads.length ? 'enquiries' : 'projects'} <ArrowUpRight size={14}/></button>
        </div>

      </section>

      <div className="overview-totals">
        {[{ label: 'Total leads', value: data.leads.length, icon: FileText, view: 'leads' }, { label: 'Active projects', value: active.length, icon: FolderKanban, view: 'projects' }, { label: agent ? 'Approved earnings' : 'Collections', value: money(income), icon: Wallet, view: agent ? 'finance' : 'payments' }].filter(item => item.view !== 'payments' || ['ADMIN', 'FINANCE', 'CUSTOMER', 'MANAGER'].includes(data.user.role)).map(item => <button key={item.label} onClick={() => onNavigate(item.view)} className="overview-total"><span className="total-icon"><item.icon size={19}/></span><span><small>{item.label}</small><strong>{item.value}</strong></span><ArrowUpRight size={15}/></button>)}
      </div>

      <div className="overview-analysis">
        <section className="performance-section">
          <div className="overview-section-title"><h3>Project pipeline</h3><select aria-label="Pipeline reporting period" value={period} onChange={e => setPeriod(e.target.value)}><option value="all">All time</option><option value="month">This month</option></select></div>
          <div className="overview-card performance-card">
            <span className="chart-caption">Your solar projects</span>
            <div className="performance-top"><div><strong>{projects.length}</strong><span>projects in your<br/>selected period</span></div><button onClick={() => onNavigate('projects')}>All projects <ArrowUpRight size={12}/></button></div>
            <div className="vertical-chart" role="img" aria-label={stages.map((stage, i) => `${stage}: ${counts[i]}`).join(', ')}>
              {stages.map((stage, i) => <div className="chart-column" key={stage}><span>{counts[i]}</span><div className="column-track"><i style={{ height: `${counts[i] / maxCount * 100}%` }}/></div><small>{stage === 'Documentation' ? 'Documents' : stage}</small></div>)}
            </div>
            <div className="chart-legend"><span/><span>Projects by current stage</span><b>{period === 'month' ? 'THIS MONTH' : 'ALL TIME'}</b></div>
          </div>
          <div className="overview-section-title recent-title"><h3>{agent ? 'Your customers' : 'Recent enquiries'}</h3><button onClick={() => onNavigate('leads')}>See all</button></div>
          <div className="overview-lead-list">{data.leads.slice(0, 3).map((lead, i) => <button className="overview-lead" key={lead.id} onClick={() => onDetail(lead, 'lead')}><span className={`customer-initial initial-${i}`}>{lead.name.split(' ').map((s: string) => s[0]).slice(0, 2).join('')}</span><span><b>{lead.name}</b><small>{lead.data.capacity?`${lead.data.capacity} kW`:'Size to be assessed'} · {lead.data.city}</small></span><span className="lead-state">{lead.status}</span><ChevronRight size={15}/></button>)}{!data.leads.length && <div className="overview-card small-empty"><FileText size={22}/><p>Your customer requirements will appear here.</p>{canAdd && <button onClick={onCreate}>Add a requirement <Plus size={13}/></button>}</div>}</div>
        </section>

        <section className="progress-section">
          <div className="overview-section-title"><h3>Installation progress</h3><button onClick={() => onNavigate('projects')} aria-label="View all project progress"><ArrowUpRight size={15}/></button></div>
          <div className="overview-card progress-card">
            <p className="progress-note">Completed installation steps</p>
            <div className="progress-ring-grid">{data.projects.filter(p => p.status !== 'Cancelled').slice(0, 6).map(p => {
              const phases = p.data.phases || [];
              const count = phases.filter((phase: Row) => phase.status === 'Completed').length;
              const percent = phases.length ? Math.round(count / phases.length * 100) : 0;
              return <button className="progress-project" key={p.id} onClick={() => onDetail(p, 'project')} aria-label={`${p.data.name}: ${percent}% of installation steps completed`}><span className="progress-ring"><svg viewBox="0 0 84 84" aria-hidden="true"><circle className="ring-track" cx="42" cy="42" r="33"/><circle className="ring-fill" cx="42" cy="42" r="33" pathLength="100" strokeDasharray={`${percent} 100`}/></svg><strong>{percent}<small>%</small></strong></span><b>{p.data.name}</b><small>{p.data.capacity} kW · {p.status}</small></button>;
            })}</div>
            {!data.projects.length && <div className="small-empty"><Sun size={25}/><p>Project progress appears once a lead is converted.</p></div>}
            <div className="capacity-note"><Sun size={20}/><div><strong>{completed.reduce((sum, p) => sum + p.data.capacity, 0)} kW</strong><span>Commissioned capacity</span></div></div>
          </div>
        </section>
      </div>
    </div>

    <aside className="overview-right" aria-label="Schedule and updates">
      <section className="overview-card schedule-card">
        <div className="overview-section-title"><div><h3>Schedule</h3><p>{dates.length} {dates.length === 1 ? 'date' : 'dates'} to keep in view</p></div><select aria-label="Schedule period" value={schedule} onChange={e => setSchedule(e.target.value)}><option value="upcoming">Upcoming</option><option value="today">Today</option></select></div>
        <div className="schedule-date"><CalendarDays size={14}/>{new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'short', timeZone: 'Asia/Kolkata' })}</div>
        <div className="schedule-list">{dates.slice(0, 5).map((item, i) => <div className="schedule-row" key={item.id}><time dateTime={item.date}>{dayLabel(item.date)}</time><button className={i === 0 ? 'schedule-event featured-event' : 'schedule-event'} onClick={() => onDetail(item.row, item.type)}><span className="event-icon">{item.type === 'project' ? <Sun size={16}/> : <Clock3 size={16}/>}</span><span><b>{item.title}</b><small>{item.label}</small></span></button></div>)}</div>
        {!dates.length && <div className="schedule-empty"><CalendarDays size={29}/><h4>A little breathing room.</h4><p>No {schedule === 'today' ? 'dates scheduled for today' : 'upcoming dates recorded'}. Follow-up and project target dates will appear here.</p><button onClick={() => onNavigate('projects')}>View projects <ArrowRight size={13}/></button></div>}
        {dates.length > 5 && <p className="schedule-more">+ {dates.length - 5} more dates in your project and lead lists</p>}
      </section>

      <section className="updates-section"><div className="overview-section-title"><h3>Latest updates</h3><button onClick={() => onNavigate('projects')}>View projects</button></div><div className="update-list">{relevantUpdates.map((n, i) => <div className="overview-card update-item" key={n.id}><span className={`update-icon update-${i}`}>{i % 2 ? <FileText size={18}/> : <CheckCircle2 size={18}/>}</span><div><p>{n.message}</p><small>{new Date(n.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', timeZone: 'Asia/Kolkata' })}</small></div></div>)}{!relevantUpdates.length && <div className="overview-card small-empty"><CheckCircle2 size={23}/><p>You’re all caught up. New project updates will appear here.</p></div>}</div></section>
      <section className="overview-help"><span><Zap size={19}/></span><h3>A brighter next step.</h3><p>{agent ? 'Have a customer in mind? Start with their requirement.' : 'Keep your next customer enquiry moving.'}</p><button onClick={canAdd ? onCreate : () => onNavigate('support')}>{canAdd ? 'Add a requirement' : 'Open support'} <ArrowRight size={14}/></button></section>
    </aside>
  </div>;
}
