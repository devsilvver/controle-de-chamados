import React, { useState, useEffect, FormEvent, useRef, useMemo } from 'react';
import { createRoot } from 'react-dom/client';

// Declaração para o TypeScript reconhecer a variável injetada pelo Vite
declare const __BUILD_DATE__: string;

// --- Interfaces ---
interface Ticket {
  id: number;
  wo: string;
  uf: string;
  status: 'Concluído' | 'Diagnóstico' | 'Trabalhado' | 'Cancelado';
  timestamp: string;
  isPresencial?: boolean;
}

type ToastType = 'success' | 'info' | 'danger';
type FilterType = Ticket['status'] | 'All' | 'Presenciais';
type ThemeType = 'light' | 'dark';

const DAILY_GOAL = 8;

// --- Componentes Visuais ---

const Icons = {
  Copy: () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>,
  Edit: () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>,
  Trash: () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg>,
  Check: () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>,
  Close: () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>,
  Trophy: () => <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="#FFD700" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M8 21h8m-4-9v9m0-9a5 5 0 0 1-5-5V3h10v4a5 5 0 0 1-5 5zm-9-5a9 9 0 0 1 9-9 9 9 0 0 1 9 9"/></svg>,
  Calendar: () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>,
  Sun: () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="5"></circle><line x1="12" y1="1" x2="12" y2="3"></line><line x1="12" y1="21" x2="12" y2="23"></line><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line><line x1="1" y1="12" x2="3" y2="12"></line><line x1="21" y1="12" x2="23" y2="12"></line><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line></svg>,
  Moon: () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path></svg>
};

const Confetti: React.FC = () => {
  const confettiCount = 200;
  const colors = ['#a864fd', '#29cdff', '#78ff44', '#ff718d', '#fdff6a', '#FFD700'];

  return (
    <div className="confetti-container" aria-hidden="true">
      {Array.from({ length: confettiCount }).map((_, index) => {
        const style: React.CSSProperties = {
          left: `${Math.random() * 100}%`,
          backgroundColor: colors[Math.floor(Math.random() * colors.length)],
          animationDuration: `${Math.random() * 2 + 3}s`,
          animationDelay: `${Math.random() * 2}s`,
        };
        const className = `confetto confetto-shape-${index % 3}`;
        return <div key={index} className={className} style={style}></div>;
      })}
    </div>
  );
};

// --- Funções Auxiliares ---
const parseTimestamp = (timestamp: string): Date => {
  if (timestamp.includes('T') && timestamp.includes('Z')) {
    return new Date(timestamp);
  }
  const parts = timestamp.match(/(\d{2})\/(\d{2})\/(\d{4}), (\d{2}):(\d{2}):(\d{2})/);
  if (parts) {
    const [, day, month, year, hour, minute, second] = parts;
    return new Date(Number(year), Number(month) - 1, Number(day), Number(hour), Number(minute), Number(second));
  }
  return new Date(timestamp);
};

const getMonthName = (monthIndex: number) => {
  const date = new Date();
  date.setMonth(monthIndex);
  const name = new Intl.DateTimeFormat('pt-BR', { month: 'long' }).format(date);
  return name.charAt(0).toUpperCase() + name.slice(1);
};

const formatDateHeader = (dateKey: string): string => {
    const today = new Date();
    const yesterday = new Date();
    yesterday.setDate(today.getDate() - 1);
    
    today.setHours(0,0,0,0);
    yesterday.setHours(0,0,0,0);
    
    const keyDate = new Date(dateKey);
    keyDate.setHours(0,0,0,0);

    if (keyDate.getTime() === today.getTime()) return 'Hoje';
    if (keyDate.getTime() === yesterday.getTime()) return 'Ontem';
    
    const formatted = new Intl.DateTimeFormat('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' }).format(keyDate);
    return formatted.charAt(0).toUpperCase() + formatted.slice(1);
};

// Converte data UTC/ISO para formato aceito pelo input datetime-local (YYYY-MM-DDThh:mm) considerando fuso local
const toLocalISOString = (isoString: string) => {
    const date = new Date(isoString);
    const offset = date.getTimezoneOffset() * 60000;
    return new Date(date.getTime() - offset).toISOString().slice(0, 16);
};

// --- Componente Principal ---
const App: React.FC = () => {
  const statusOptions: Ticket['status'][] = ['Concluído', 'Diagnóstico', 'Trabalhado', 'Cancelado'];

  const [theme, setTheme] = useState<ThemeType>(() => {
    try {
      const savedTheme = localStorage.getItem('theme');
      if (savedTheme === 'dark' || savedTheme === 'light') return savedTheme;
      return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    } catch {
      return 'light';
    }
  });

  const [tickets, setTickets] = useState<Ticket[]>(() => {
    try {
      const savedTicketsRaw = localStorage.getItem('tickets');
      if (!savedTicketsRaw) return [];
      
      let savedTickets = JSON.parse(savedTicketsRaw);

      if (savedTickets.length > 0 && savedTickets.some((t: any) => 'resolutionType' in t)) {
        return savedTickets.map((ticket: any) => {
          const { resolutionType, ...rest } = ticket;
          const newTicket = { ...rest };
          if (resolutionType === 'Presencial') {
            newTicket.isPresencial = true;
          }
          return newTicket;
        });
      }
      return savedTickets;
    } catch (error) {
      console.error("Falha ao carregar chamados", error);
      return [];
    }
  });

  const [wo, setWo] = useState<string>('');
  const [uf, setUf] = useState<string>('');
  const [status, setStatus] = useState<Ticket['status']>('Concluído');
  const [isPresencial, setIsPresencial] = useState<boolean>(false);
  
  const [filterStatus, setFilterStatus] = useState<FilterType>('All');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [searchDate, setSearchDate] = useState<string>('');

  const [toast, setToast] = useState<{ message: string; type: ToastType }>({ message: '', type: 'success' });
  const [isDataMenuOpen, setIsDataMenuOpen] = useState<boolean>(false);
  
  const [editingTicketId, setEditingTicketId] = useState<number | null>(null);
  // Agora inclui timestamp
  const [editFormData, setEditFormData] = useState<Omit<Ticket, 'id'>>({ wo: '', uf: '', status: 'Concluído', isPresencial: false, timestamp: '' });

  const [deleteConfirmation, setDeleteConfirmation] = useState<{ isOpen: boolean, ticketId: number | null }>({ isOpen: false, ticketId: null });
  const [celebrationModal, setCelebrationModal] = useState<boolean>(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const dataMenuRef = useRef<HTMLDivElement>(null);
  
  const todaysCount = useMemo(() => tickets.filter(ticket => {
    if (!ticket.timestamp) return false;
    const ticketDate = parseTimestamp(ticket.timestamp);
    if (isNaN(ticketDate.getTime())) return false;
    
    const today = new Date();
    return ticketDate.getDate() === today.getDate() &&
           ticketDate.getMonth() === today.getMonth() &&
           ticketDate.getFullYear() === today.getFullYear();
  }).length, [tickets]);

  const prevTodaysCount = useRef(todaysCount);

  useEffect(() => {
    document.body.className = `${theme}-theme`;
    localStorage.setItem('theme', theme);
  }, [theme]);

  useEffect(() => {
    localStorage.setItem('tickets', JSON.stringify(tickets));
  }, [tickets]);
  
  useEffect(() => {
    if (prevTodaysCount.current < DAILY_GOAL && todaysCount >= DAILY_GOAL) {
      setCelebrationModal(true);
      const timer = setTimeout(() => setCelebrationModal(false), 6000);
      return () => clearTimeout(timer);
    }
    prevTodaysCount.current = todaysCount;
  }, [todaysCount]);

  useEffect(() => {
    if (toast.message) {
      const timer = setTimeout(() => {
        setToast({ message: '', type: 'success' });
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
        const target = event.target as Node;
        if (isDataMenuOpen && dataMenuRef.current && !dataMenuRef.current.contains(target)) {
            setIsDataMenuOpen(false);
        }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
        document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isDataMenuOpen]);

  const toggleTheme = () => {
    setTheme(prev => prev === 'light' ? 'dark' : 'light');
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!wo.trim() || !uf.trim()) {
      alert('Por favor, preencha os campos WO e UF.');
      return;
    }
    const newTicket: Ticket = {
      id: Date.now(),
      wo: wo.trim().toUpperCase(),
      uf: uf.trim().toUpperCase(),
      status,
      timestamp: new Date().toISOString(),
      ...(status === 'Concluído' && isPresencial && { isPresencial: true }),
    };
    setTickets(prevTickets => [newTicket, ...prevTickets]);
    setToast({ message: 'Chamado adicionado!', type: 'success' });
    setWo('');
    setUf('');
    setStatus('Concluído');
    setIsPresencial(false);
  };

  const confirmDelete = () => {
    if (deleteConfirmation.ticketId) {
        setTickets(prevTickets => prevTickets.filter(ticket => ticket.id !== deleteConfirmation.ticketId));
        setToast({ message: 'Chamado excluído.', type: 'info' });
    }
    setDeleteConfirmation({ isOpen: false, ticketId: null });
  };
  
  const handleEdit = (ticket: Ticket) => {
    setEditingTicketId(ticket.id);
    setEditFormData({ 
        wo: ticket.wo, 
        uf: ticket.uf, 
        status: ticket.status, 
        isPresencial: ticket.isPresencial || false,
        timestamp: ticket.timestamp // Carrega a data original
    });
  };

  const handleCancelEdit = () => {
    setEditingTicketId(null);
  };
  
  const handleSave = (id: number) => {
    setTickets(prevTickets =>
      prevTickets.map(ticket => {
        if (ticket.id === id) {
          const finalData: Partial<Omit<Ticket, 'id'>> = { ...editFormData };
          if (finalData.status !== 'Concluído' || !finalData.isPresencial) {
            delete finalData.isPresencial;
          }
          return { ...ticket, ...finalData };
        }
        return ticket;
      })
    );
    setEditingTicketId(null);
    setToast({ message: 'Atualizado com sucesso!', type: 'success' });
  };

  const handleCopyWo = (wo: string) => {
    navigator.clipboard.writeText(wo).then(() => {
      setToast({ message: `WO copiada!`, type: 'info' });
    }).catch(err => {
      setToast({ message: 'Erro ao copiar.', type: 'danger'});
    });
  };
  
  const handleExport = () => {
    if (tickets.length === 0) {
      setToast({ message: 'Nada para exportar.', type: 'info' });
      return;
    }
    const dataStr = JSON.stringify(tickets, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'backup_chamados.json';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    setToast({ message: 'Backup salvo!', type: 'success' });
  };

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const text = e.target?.result;
        if (typeof text !== 'string') throw new Error('Erro de leitura');
        const importedTickets = JSON.parse(text);
        if (!Array.isArray(importedTickets)) throw new Error('Formato inválido');
        if (window.confirm('Isso substituirá seus dados atuais. Continuar?')) {
          setTickets(importedTickets);
          setToast({ message: 'Dados importados!', type: 'success' });
        }
      } catch (error) {
        setToast({ message: 'Erro na importação.', type: 'danger' });
      } finally {
        if(event.target) event.target.value = '';
      }
    };
    reader.readAsText(file);
  };

  const filterOptions: FilterType[] = ['All', 'Presenciais', ...statusOptions];

  const filteredTickets = tickets.filter(ticket => {
    let statusMatch = true;
    if (filterStatus === 'All') statusMatch = true;
    else if (filterStatus === 'Presenciais') statusMatch = ticket.isPresencial === true;
    else statusMatch = ticket.status === filterStatus;

    const searchMatch = ticket.wo.toLowerCase().includes(searchTerm.toLowerCase());

    let dateMatch = true;
    if (searchDate) {
        const ticketDate = parseTimestamp(ticket.timestamp);
        const year = ticketDate.getFullYear();
        const month = String(ticketDate.getMonth() + 1).padStart(2, '0');
        const day = String(ticketDate.getDate()).padStart(2, '0');
        const ticketDateString = `${year}-${month}-${day}`;
        dateMatch = ticketDateString === searchDate;
    }

    return statusMatch && searchMatch && dateMatch;
  });
  
  const groupedTickets = filteredTickets.reduce((acc, ticket) => {
    const ticketDate = parseTimestamp(ticket.timestamp);
    if (isNaN(ticketDate.getTime())) return acc;
    
    const year = ticketDate.getFullYear();
    const month = ticketDate.getMonth();
    const dayKey = new Date(year, month, ticketDate.getDate()).toISOString();

    if (!acc[year]) acc[year] = {};
    if (!acc[year][month]) acc[year][month] = {};
    if (!acc[year][month][dayKey]) acc[year][month][dayKey] = [];

    acc[year][month][dayKey].push(ticket);
    return acc;
  }, {} as Record<number, Record<number, Record<string, Ticket[]>>>);

  const sortedYears = Object.keys(groupedTickets).map(Number).sort((a, b) => b - a);
  
  const progress = Math.min((todaysCount / DAILY_GOAL) * 100, 100);

  return (
    <main>
      {/* Modais */}
      {celebrationModal && (
        <div className="modal-overlay celebration-overlay">
            <Confetti />
            <div className="celebration-content pop-in">
                <div className="trophy-anim"><Icons.Trophy /></div>
                <h2>META BATIDA!</h2>
                <p>Excelente trabalho! Você atingiu {DAILY_GOAL} chamados hoje.</p>
                <button className="btn-celebrate" onClick={() => setCelebrationModal(false)}>Continuar</button>
            </div>
        </div>
      )}

      {deleteConfirmation.isOpen && (
        <div className="modal-overlay fade-in">
            <div className="modal-content scale-up">
                <h3>Excluir Chamado?</h3>
                <p>Tem certeza que deseja remover este registro? Essa ação não pode ser desfeita.</p>
                <div className="modal-actions">
                    <button className="btn-secondary" onClick={() => setDeleteConfirmation({ isOpen: false, ticketId: null })}>Cancelar</button>
                    <button className="btn-danger" onClick={confirmDelete}>Sim, Excluir</button>
                </div>
            </div>
        </div>
      )}

      <header>
        <div className="header-container">
          <div className="logo-area">
             <div className="logo-icon">📋</div>
             <div>
                <h1>Controle de Chamados</h1>
                <span className="subtitle">Dashboard de Produtividade</span>
             </div>
          </div>
          <div className="header-actions" ref={dataMenuRef}>
            {/* BUILD DATE AGORA NO HEADER */}
            <span className="build-date" title="Data da última atualização">
               v. {__BUILD_DATE__}
            </span>

            <button 
                className="btn-icon-only" 
                onClick={toggleTheme}
                title={theme === 'light' ? 'Ativar Modo Noturno' : 'Ativar Modo Claro'}
            >
                {theme === 'light' ? <Icons.Moon /> : <Icons.Sun />}
            </button>
            
            <button 
              className="btn-icon-only" 
              onClick={(e) => {
                  e.stopPropagation();
                  setIsDataMenuOpen(prev => !prev);
              }}
              aria-label="Configurações"
              title="Backup e Restauração"
            >
              ⚙️
            </button>
            {isDataMenuOpen && (
              <div className="dropdown-menu right">
                <button onClick={() => { handleExport(); setIsDataMenuOpen(false); }}>💾 Backup (Exportar)</button>
                <button onClick={() => { handleImportClick(); setIsDataMenuOpen(false); }}>Cc Restaurar (Importar)</button>
              </div>
            )}
          </div>
        </div>
      </header>

      <section className="dashboard-summary">
        <div className="card goal-card">
           <div className="goal-info">
              <span className="goal-label">Meta Diária</span>
              <div className="goal-numbers">
                <span className="current">{todaysCount}</span>
                <span className="target">/ {DAILY_GOAL}</span>
              </div>
           </div>
           <div className="goal-visual">
              <div className="progress-bg">
                <div 
                  className={`progress-fill ${todaysCount >= DAILY_GOAL ? 'success' : ''}`}
                  style={{ width: `${progress}%` }}
                ></div>
              </div>
              <p className="goal-text">
                {todaysCount >= DAILY_GOAL ? 'Meta atingida! 🚀' : `Faltam ${DAILY_GOAL - todaysCount} chamados`}
              </p>
           </div>
        </div>

        <div className="card form-card">
          <form onSubmit={handleSubmit} className="entry-form">
            <div className="form-row">
              <div className="input-group">
                <label htmlFor="wo">Número WO</label>
                <input
                  id="wo"
                  type="text"
                  value={wo}
                  onChange={(e) => setWo(e.target.value)}
                  placeholder="00000..."
                  required
                />
              </div>
              <div className="input-group small">
                <label htmlFor="uf">UF</label>
                <input
                  id="uf"
                  type="text"
                  value={uf}
                  onChange={(e) => setUf(e.target.value.toUpperCase())}
                  placeholder="UF"
                  maxLength={3}
                  required
                />
              </div>
              <div className="input-group">
                <label htmlFor="status">Status</label>
                <select
                  id="status"
                  value={status}
                  onChange={(e) => setStatus(e.target.value as Ticket['status'])}
                >
                  {statusOptions.map(option => (
                    <option key={option} value={option}>{option}</option>
                  ))}
                </select>
              </div>
            </div>
            
            <div className="form-footer">
              <div className="form-options">
                {status === 'Concluído' && (
                    <label className="checkbox-modern">
                    <input
                        type="checkbox"
                        checked={isPresencial}
                        onChange={(e) => setIsPresencial(e.target.checked)}
                    />
                    <span className="checkmark"></span>
                    Atendimento Presencial
                    </label>
                )}
              </div>
              <button type="submit" className="btn-submit">
                Adicionar
              </button>
            </div>
          </form>
        </div>
      </section>

      <section className="feed-section">
        <div className="controls-bar">
          <div className="search-group">
             <div className="search-box">
                <span className="icon">🔎</span>
                <input 
                 type="text"
                 placeholder="Pesquisar WO..."
                 value={searchTerm}
                 onChange={(e) => setSearchTerm(e.target.value)}
               />
             </div>
             <div className="date-box">
                <input 
                    type="date" 
                    value={searchDate}
                    onChange={(e) => setSearchDate(e.target.value)}
                    title="Filtrar por data"
                />
             </div>
          </div>
          
          <div className="filter-pills">
              {filterOptions.map(option => (
                <button
                  key={option}
                  className={`pill ${filterStatus === option ? 'active' : ''}`}
                  onClick={() => setFilterStatus(option)}
                >
                  {option === 'All' ? 'Todos' : option}
                </button>
              ))}
          </div>
        </div>
        
        <input 
          type="file" 
          ref={fileInputRef} 
          onChange={handleFileChange} 
          accept="application/json" 
          style={{ display: 'none' }} 
        />

        <div className="tickets-feed">
          {tickets.length > 0 ? (
            sortedYears.length > 0 ? (
              sortedYears.map(year => (
                <div key={year} className="year-box fade-in">
                  <h2 className="year-title">{year}</h2>
                  <div className="year-content">
                      {Object.keys(groupedTickets[year])
                          .map(Number)
                          .sort((a, b) => b - a)
                          .map(month => (
                              <div key={month} className="month-box">
                                  <h3 className="month-title">{getMonthName(month)}</h3>
                                  <div className="month-content">
                                      {Object.keys(groupedTickets[year][month])
                                        .sort((a, b) => new Date(b).getTime() - new Date(a).getTime())
                                        .map(dayKey => (
                                          <div key={dayKey} className="day-group">
                                             <h4 className="day-header">{formatDateHeader(dayKey)}</h4>
                                             <div className="day-list">
                                                {groupedTickets[year][month][dayKey].map(ticket => (
                                                    <div key={ticket.id} className="ticket-card">
                                                        {editingTicketId === ticket.id ? (
                                                            <div className="edit-mode">
                                                                <input className="edit-input" type="text" value={editFormData.wo} onChange={e => setEditFormData({...editFormData, wo: e.target.value.toUpperCase()})} />
                                                                <input className="edit-input small" type="text" value={editFormData.uf} maxLength={3} onChange={e => setEditFormData({...editFormData, uf: e.target.value.toUpperCase()})} />
                                                                <select className="edit-input" value={editFormData.status} onChange={e => setEditFormData({...editFormData, status: e.target.value as Ticket['status']})}>
                                                                    {statusOptions.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                                                                </select>
                                                                
                                                                {/* CAMPO DE EDIÇÃO DE DATA */}
                                                                <input 
                                                                    type="datetime-local"
                                                                    className="edit-input date-edit"
                                                                    value={toLocalISOString(editFormData.timestamp)}
                                                                    onChange={(e) => {
                                                                        const date = new Date(e.target.value);
                                                                        if(!isNaN(date.getTime())) {
                                                                            setEditFormData({...editFormData, timestamp: date.toISOString()});
                                                                        }
                                                                    }}
                                                                />

                                                                {editFormData.status === 'Concluído' && (
                                                                    <label className="checkbox-simple">
                                                                        <input type="checkbox" checked={editFormData.isPresencial} onChange={e => setEditFormData({...editFormData, isPresencial: e.target.checked})} /> Presencial
                                                                    </label>
                                                                )}
                                                                <div className="edit-actions">
                                                                    <button onClick={() => handleSave(ticket.id)} className="btn-icon save" title="Salvar"><Icons.Check /></button>
                                                                    <button onClick={handleCancelEdit} className="btn-icon cancel" title="Cancelar"><Icons.Close /></button>
                                                                </div>
                                                            </div>
                                                        ) : (
                                                            <>
                                                            <div className="card-left">
                                                                <div className={`status-dot ${ticket.status}`}></div>
                                                                <div>
                                                                    <div className="ticket-wo">{ticket.wo}</div>
                                                                    <div className="ticket-time">
                                                                    {parseTimestamp(ticket.timestamp).toLocaleTimeString('pt-BR', {hour: '2-digit', minute:'2-digit'})}
                                                                    <span className="dot-sep">•</span>
                                                                    {ticket.uf}
                                                                    </div>
                                                                </div>
                                                            </div>

                                                            <div className="card-right">
                                                                <div className="tags">
                                                                    {ticket.isPresencial && <span className="tag presencial">Presencial</span>}
                                                                    {(ticket.status === 'Diagnóstico' || ticket.status === 'Trabalhado' || ticket.status === 'Cancelado') && (
                                                                    <span className="tag otrs">OTRS</span>
                                                                    )}
                                                                    <span className={`tag status ${ticket.status}`}>{ticket.status}</span>
                                                                </div>
                                                                
                                                                <div className="actions-direct">
                                                                    <button onClick={() => handleCopyWo(ticket.wo)} className="action-btn" title="Copiar WO">
                                                                        <Icons.Copy />
                                                                    </button>
                                                                    <button onClick={() => handleEdit(ticket)} className="action-btn" title="Editar">
                                                                        <Icons.Edit />
                                                                    </button>
                                                                    <button onClick={() => setDeleteConfirmation({ isOpen: true, ticketId: ticket.id })} className="action-btn danger" title="Excluir">
                                                                        <Icons.Trash />
                                                                    </button>
                                                                </div>
                                                            </div>
                                                            </>
                                                        )}
                                                    </div>
                                                ))}
                                             </div>
                                          </div>
                                        ))}
                                  </div>
                              </div>
                          ))}
                  </div>
                </div>
              ))
            ) : (
               <div className="empty-state">
                  <div className="empty-icon">🔍</div>
                  <p>Nenhum chamado encontrado com este filtro.</p>
               </div>
            )
          ) : (
            <div className="empty-state">
              <div className="empty-icon">📝</div>
              <p>Sua lista está vazia. Adicione o primeiro chamado acima!</p>
            </div>
          )}
        </div>
      </section>
      
      <div className={`toast ${toast.type} ${toast.message ? 'show' : ''}`}>
        {toast.message}
      </div>
    </main>
  );
};

const container = document.getElementById('root');
const root = createRoot(container!);
root.render(<App />);