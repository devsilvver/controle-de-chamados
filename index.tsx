import React, { useState, useEffect, FormEvent, useRef, useMemo } from 'react';
import { createRoot } from 'react-dom/client';

// Define a estrutura de um chamado
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

const DAILY_GOAL = 8;

const Confetti: React.FC = () => {
  const confettiCount = 150;
  const colors = ['#a864fd', '#29cdff', '#78ff44', '#ff718d', '#fdff6a'];

  return (
    <div className="confetti-container" aria-hidden="true">
      {Array.from({ length: confettiCount }).map((_, index) => {
        const style: React.CSSProperties = {
          left: `${Math.random() * 100}%`,
          backgroundColor: colors[Math.floor(Math.random() * colors.length)],
          animationDuration: `${Math.random() * 3 + 4}s`,
          animationDelay: `${Math.random() * 5}s`,
        };
        const className = `confetto confetto-shape-${index % 3}`;
        return <div key={index} className={className} style={style}></div>;
      })}
    </div>
  );
};

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


const App: React.FC = () => {
  const statusOptions: Ticket['status'][] = ['Concluído', 'Diagnóstico', 'Trabalhado', 'Cancelado'];

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
  const [editingTicketId, setEditingTicketId] = useState<number | null>(null);
  const [editFormData, setEditFormData] = useState<Omit<Ticket, 'id' | 'timestamp'>>({ wo: '', uf: '', status: 'Concluído', isPresencial: false });
  const [toast, setToast] = useState<{ message: string; type: ToastType }>({ message: '', type: 'success' });
  const [actionsMenuId, setActionsMenuId] = useState<number | null>(null);
  const [isDataMenuOpen, setIsDataMenuOpen] = useState<boolean>(false);
  const [showConfetti, setShowConfetti] = useState<boolean>(false);

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
    localStorage.setItem('tickets', JSON.stringify(tickets));
  }, [tickets]);
  
  useEffect(() => {
    if (prevTodaysCount.current < DAILY_GOAL && todaysCount >= DAILY_GOAL) {
      setShowConfetti(true);
      const timer = setTimeout(() => setShowConfetti(false), 7000);
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

        // Fecha menu de configurações
        if (isDataMenuOpen && dataMenuRef.current && !dataMenuRef.current.contains(target)) {
            setIsDataMenuOpen(false);
        }

        // Fecha menu de ações da linha
        if (actionsMenuId !== null) {
            const isDropdown = (target as Element).closest('.dropdown-menu');
            const isTrigger = (target as Element).closest('.btn-more');
            if (!isDropdown && !isTrigger) {
                setActionsMenuId(null);
            }
        }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
        document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isDataMenuOpen, actionsMenuId]);

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

  const handleDelete = (id: number) => {
    if (window.confirm('Tem certeza que deseja excluir este chamado?')) {
      setTickets(prevTickets => prevTickets.filter(ticket => ticket.id !== id));
      setToast({ message: 'Chamado excluído.', type: 'info' });
    }
    setActionsMenuId(null);
  };
  
  const handleEdit = (ticket: Ticket) => {
    setEditingTicketId(ticket.id);
    setEditFormData({ wo: ticket.wo, uf: ticket.uf, status: ticket.status, isPresencial: ticket.isPresencial || false });
    setActionsMenuId(null);
  };

  const handleCancelEdit = () => {
    setEditingTicketId(null);
  };
  
  const handleSave = (id: number) => {
    setTickets(prevTickets =>
      prevTickets.map(ticket => {
        if (ticket.id === id) {
          const finalData: Partial<Omit<Ticket, 'id' | 'timestamp'>> = { ...editFormData };
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
    setActionsMenuId(null);
  };

  const toggleActionsMenu = (id: number) => {
    setActionsMenuId(prevId => (prevId === id ? null : id));
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

    if (filterStatus === 'All') {
        statusMatch = true;
    } else if (filterStatus === 'Presenciais') {
        statusMatch = ticket.isPresencial === true;
    } else {
        statusMatch = ticket.status === filterStatus;
    }

    const searchMatch = ticket.wo.toLowerCase().includes(searchTerm.toLowerCase());
    return statusMatch && searchMatch;
  });
  
  const groupedTickets = filteredTickets.reduce((acc, ticket) => {
    if (!ticket.timestamp) return acc;
    const ticketDate = parseTimestamp(ticket.timestamp);
    if (isNaN(ticketDate.getTime())) return acc;
    
    const dateKey = new Date(ticketDate.getFullYear(), ticketDate.getMonth(), ticketDate.getDate()).toISOString();

    if (!acc[dateKey]) {
      acc[dateKey] = [];
    }
    acc[dateKey].push(ticket);
    return acc;
  }, {} as Record<string, Ticket[]>);

  const sortedDateKeys = Object.keys(groupedTickets).sort((a, b) => new Date(b).getTime() - new Date(a).getTime());

  const formatDateHeader = (dateKey: string): string => {
    const today = new Date();
    const yesterday = new Date();
    yesterday.setDate(today.getDate() - 1);
    const keyDate = new Date(dateKey);

    if (keyDate.toDateString() === today.toDateString()) return 'Hoje';
    if (keyDate.toDateString() === yesterday.toDateString()) return 'Ontem';
    
    const formatted = new Intl.DateTimeFormat('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' }).format(keyDate);
    return formatted.charAt(0).toUpperCase() + formatted.slice(1);
  };
  
  const progress = Math.min((todaysCount / DAILY_GOAL) * 100, 100);

  return (
    <main>
      {showConfetti && <Confetti />}
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
          <div className="search-box">
             <span className="icon">🔎</span>
             <input 
              type="text"
              placeholder="Pesquisar WO..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
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
            sortedDateKeys.length > 0 ? (
              sortedDateKeys.map(dateKey => (
                <div key={dateKey} className="day-group fade-in">
                  <div className="day-header">
                    <span className="day-title">{formatDateHeader(dateKey)}</span>
                    <span className="day-line"></span>
                  </div>
                  <div className="day-list">
                  {groupedTickets[dateKey].map(ticket => (
                    <div key={ticket.id} className="ticket-card">
                      {editingTicketId === ticket.id ? (
                        <div className="edit-mode">
                          <input className="edit-input" type="text" value={editFormData.wo} onChange={e => setEditFormData({...editFormData, wo: e.target.value.toUpperCase()})} />
                          <input className="edit-input small" type="text" value={editFormData.uf} maxLength={3} onChange={e => setEditFormData({...editFormData, uf: e.target.value.toUpperCase()})} />
                          <select className="edit-input" value={editFormData.status} onChange={e => setEditFormData({...editFormData, status: e.target.value as Ticket['status']})}>
                              {statusOptions.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                          </select>
                           {editFormData.status === 'Concluído' && (
                              <label className="checkbox-simple">
                                  <input type="checkbox" checked={editFormData.isPresencial} onChange={e => setEditFormData({...editFormData, isPresencial: e.target.checked})} /> Presencial
                              </label>
                          )}
                          <div className="edit-actions">
                             <button onClick={() => handleSave(ticket.id)} className="btn-icon save" title="Salvar">✓</button>
                             <button onClick={handleCancelEdit} className="btn-icon cancel" title="Cancelar">✕</button>
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
                             
                             <div className="menu-wrapper">
                                <button 
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        toggleActionsMenu(ticket.id);
                                    }} 
                                    className="btn-more"
                                >
                                    •••
                                </button>
                                {actionsMenuId === ticket.id && (
                                  <div className="dropdown-menu">
                                    <button onClick={() => handleCopyWo(ticket.wo)}>Copiar WO</button>
                                    <button onClick={() => handleEdit(ticket)}>Editar</button>
                                    <button onClick={() => handleDelete(ticket.id)} className="danger">Excluir</button>
                                  </div>
                                )}
                             </div>
                          </div>
                        </>
                      )}
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