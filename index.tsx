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

interface MonthlyReport {
  totalTickets: number;
  completedTickets: number;
  averagePerDay: string;
  presencialCount: number;
  remotoCount: number;
  ticketsForMonth: Ticket[];
}

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
          animationDuration: `${Math.random() * 3 + 4}s`, // 4 to 7 seconds
          animationDelay: `${Math.random() * 5}s`,
        };
        const className = `confetto confetto-shape-${index % 3}`;
        return <div key={index} className={className} style={style}></div>;
      })}
    </div>
  );
};

const parseTimestamp = (timestamp: string): Date => {
  // Check if it's an ISO string (contains 'T' and 'Z')
  if (timestamp.includes('T') && timestamp.includes('Z')) {
    return new Date(timestamp);
  }
  // Try to parse the pt-BR format "dd/MM/yyyy, HH:mm:ss"
  const parts = timestamp.match(/(\d{2})\/(\d{2})\/(\d{4}), (\d{2}):(\d{2}):(\d{2})/);
  if (parts) {
    const [, day, month, year, hour, minute, second] = parts;
    // Month is 0-indexed in JS Date
    return new Date(Number(year), Number(month) - 1, Number(day), Number(hour), Number(minute), Number(second));
  }
  // Fallback for other potential formats
  return new Date(timestamp);
};


const App: React.FC = () => {
  const statusOptions: Ticket['status'][] = ['Concluído', 'Diagnóstico', 'Trabalhado', 'Cancelado'];

  const [tickets, setTickets] = useState<Ticket[]>(() => {
    try {
      const savedTicketsRaw = localStorage.getItem('tickets');
      if (!savedTicketsRaw) return [];
      
      let savedTickets = JSON.parse(savedTicketsRaw);

      // Migration logic from resolutionType to isPresencial
      if (savedTickets.length > 0 && savedTickets.some((t: any) => 'resolutionType' in t)) {
        console.log("Migrando tickets de resolutionType para isPresencial...");
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
      console.error("Falha ao analisar ou migrar os chamados do localStorage", error);
      return [];
    }
  });

  const [wo, setWo] = useState<string>('');
  const [uf, setUf] = useState<string>('');
  const [status, setStatus] = useState<Ticket['status']>('Concluído');
  const [isPresencial, setIsPresencial] = useState<boolean>(false);
  const [filterStatus, setFilterStatus] = useState<Ticket['status'] | 'All'>('All');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [editingTicketId, setEditingTicketId] = useState<number | null>(null);
  const [editFormData, setEditFormData] = useState<Omit<Ticket, 'id' | 'timestamp'>>({ wo: '', uf: '', status: 'Concluído', isPresencial: false });
  const [toast, setToast] = useState<{ message: string; type: ToastType }>({ message: '', type: 'success' });
  const [actionsMenuId, setActionsMenuId] = useState<number | null>(null);
  const [selectedReportMonth, setSelectedReportMonth] = useState<string>('');
  const [monthlyReportData, setMonthlyReportData] = useState<MonthlyReport | null>(null);
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
      const timer = setTimeout(() => setShowConfetti(false), 7000); // Duration matches animation + buffer
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
        if (dataMenuRef.current && !dataMenuRef.current.contains(event.target as Node)) {
            setIsDataMenuOpen(false);
        }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
        document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

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
    setToast({ message: 'Chamado adicionado com sucesso!', type: 'success' });
    setWo('');
    setUf('');
    setStatus('Concluído');
    setIsPresencial(false);
  };

  const handleDelete = (id: number) => {
    if (window.confirm('Tem certeza que deseja excluir este chamado?')) {
      setTickets(prevTickets => prevTickets.filter(ticket => ticket.id !== id));
      setToast({ message: 'Chamado excluído com sucesso!', type: 'info' });
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
    setToast({ message: 'Chamado atualizado com sucesso!', type: 'success' });
  };

  const handleCopyWo = (wo: string) => {
    navigator.clipboard.writeText(wo).then(() => {
      setToast({ message: `WO "${wo}" copiado!`, type: 'info' });
    }).catch(err => {
      console.error('Failed to copy text: ', err);
      setToast({ message: 'Falha ao copiar.', type: 'danger'});
    });
    setActionsMenuId(null);
  };

  const toggleActionsMenu = (id: number) => {
    setActionsMenuId(prevId => (prevId === id ? null : id));
  };
  
  const handleExport = () => {
    if (tickets.length === 0) {
      setToast({ message: 'Nenhum chamado para exportar.', type: 'info' });
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
    setToast({ message: 'Dados exportados com sucesso!', type: 'success' });
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
        if (typeof text !== 'string') {
            throw new Error('File could not be read');
        }
        const importedTickets = JSON.parse(text);

        // Basic validation
        if (!Array.isArray(importedTickets) || (importedTickets.length > 0 && !importedTickets[0].wo)) {
          throw new Error('Arquivo JSON inválido ou formato incorreto.');
        }

        if (window.confirm('Isso substituirá todos os chamados atuais. Deseja continuar?')) {
          setTickets(importedTickets);
          setToast({ message: 'Dados importados com sucesso!', type: 'success' });
        }
      } catch (error) {
        console.error('Failed to import tickets:', error);
        setToast({ message: 'Falha ao importar. Verifique o arquivo.', type: 'danger' });
      } finally {
        // Reset file input
        if(event.target) event.target.value = '';
      }
    };
    reader.readAsText(file);
  };

  const filterOptions: (Ticket['status'] | 'All')[] = ['All', ...statusOptions];

  const filteredTickets = tickets.filter(ticket => {
    const statusMatch = filterStatus === 'All' || ticket.status === filterStatus;
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

    if (keyDate.toDateString() === today.toDateString()) {
      return 'Hoje';
    }
    if (keyDate.toDateString() === yesterday.toDateString()) {
      return 'Ontem';
    }
    return new Intl.DateTimeFormat('pt-BR', { year: 'numeric', month: 'long', day: 'numeric', timeZone: 'UTC' }).format(keyDate);
  };
  
  const progress = Math.min((todaysCount / DAILY_GOAL) * 100, 100);

  const getGoalMessage = () => {
    if (todaysCount >= DAILY_GOAL) {
      const surpassedBy = todaysCount - DAILY_GOAL;
      if (surpassedBy > 0) {
        return `Incrível! Você superou sua meta em ${surpassedBy} chamado${surpassedBy > 1 ? 's' : ''}!`;
      }
      return 'Parabéns! Você alcançou sua meta de hoje!';
    } else {
      const remaining = DAILY_GOAL - todaysCount;
      return `Continue assim! Faltam ${remaining} chamado${remaining > 1 ? 's' : ''} para sua meta.`;
    }
  };

  const availableReportMonths = useMemo(() => {
    const monthSet = new Set<string>();
    tickets.forEach(ticket => {
        const date = parseTimestamp(ticket.timestamp);
        if (!isNaN(date.getTime())) {
            const year = date.getFullYear();
            const month = (date.getMonth() + 1).toString().padStart(2, '0');
            monthSet.add(`${year}-${month}`);
        }
    });
    return Array.from(monthSet).sort((a, b) => b.localeCompare(a));
  }, [tickets]);

  useEffect(() => {
    if (availableReportMonths.length > 0 && !selectedReportMonth) {
        setSelectedReportMonth(availableReportMonths[0]);
    }
  }, [availableReportMonths, selectedReportMonth]);

  const formatMonthForDisplay = (monthStr: string) => {
    if (!monthStr) return '';
    const [year, month] = monthStr.split('-');
    const date = new Date(Number(year), Number(month) - 1, 1);
    const formatted = new Intl.DateTimeFormat('pt-BR', { month: 'long', year: 'numeric', timeZone: 'UTC' }).format(date);
    return formatted.charAt(0).toUpperCase() + formatted.slice(1);
  };

  const handleGenerateReport = () => {
    if (!selectedReportMonth) {
      setToast({ message: 'Por favor, selecione um mês.', type: 'info' });
      return;
    }

    const ticketsForMonth = tickets.filter(ticket => {
      const date = parseTimestamp(ticket.timestamp);
      if (isNaN(date.getTime())) return false;
      const year = date.getFullYear();
      const month = (date.getMonth() + 1).toString().padStart(2, '0');
      return `${year}-${month}` === selectedReportMonth;
    });

    if (ticketsForMonth.length === 0) {
      setToast({ message: 'Nenhum chamado encontrado para este mês.', type: 'info' });
      setMonthlyReportData(null);
      return;
    }
    
    const completedTickets = ticketsForMonth.filter(t => t.status === 'Concluído');
    const presencialCount = completedTickets.filter(t => t.isPresencial).length;
    const remotoCount = completedTickets.length - presencialCount;

    const uniqueDays = new Set(
      ticketsForMonth.map(t => parseTimestamp(t.timestamp).toISOString().split('T')[0])
    );

    const averagePerDay = (ticketsForMonth.length / (uniqueDays.size || 1)).toFixed(2);

    setMonthlyReportData({
      totalTickets: ticketsForMonth.length,
      completedTickets: completedTickets.length,
      averagePerDay,
      presencialCount,
      remotoCount,
      ticketsForMonth,
    });
    setToast({ message: 'Relatório gerado com sucesso!', type: 'success' });
  };

  const handleDownloadCsv = () => {
    if (!monthlyReportData || monthlyReportData.ticketsForMonth.length === 0) {
        setToast({ message: 'Nenhum dado para exportar.', type: 'info' });
        return;
    }

    const headers = ['WO', 'UF', 'Status', 'Data', 'Presencial'];
    const csvRows = [headers.join(',')];

    monthlyReportData.ticketsForMonth.forEach(ticket => {
        const row = [
            `"${ticket.wo}"`,
            `"${ticket.uf}"`,
            `"${ticket.status}"`,
            `"${parseTimestamp(ticket.timestamp).toLocaleString('pt-BR')}"`,
            `"${ticket.isPresencial ? 'Sim' : 'Não'}"`
        ].join(',');
        csvRows.push(row);
    });

    const csvString = csvRows.join('\n');
    const blob = new Blob([`\uFEFF${csvString}`], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `relatorio_chamados_${selectedReportMonth}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setToast({ message: 'CSV baixado com sucesso!', type: 'success' });
  };


  return (
    <main>
      {showConfetti && <Confetti />}
      <header>
        <h1>Controle de Chamados</h1>
        <div className="data-menu-container" ref={dataMenuRef}>
          <button 
            className="data-menu-trigger" 
            onClick={() => setIsDataMenuOpen(prev => !prev)}
            aria-label="Opções de gerenciamento de dados"
            aria-haspopup="true"
            aria-expanded={isDataMenuOpen}
          >
            &#9881;
          </button>
          {isDataMenuOpen && (
            <div className="data-menu" role="menu">
              <button onClick={() => { handleExport(); setIsDataMenuOpen(false); }} role="menuitem">Exportar Dados</button>
              <button onClick={() => { handleImportClick(); setIsDataMenuOpen(false); }} role="menuitem">Importar Dados</button>
            </div>
          )}
        </div>
      </header>

      <section className="form-container" aria-labelledby="form-heading">
        <h2 id="form-heading" className="sr-only">Adicionar Novo Chamado</h2>
        <form onSubmit={handleSubmit}>
          <div className="form-grid">
            <div className="form-group">
              <label htmlFor="wo">WO do Chamado</label>
              <input
                id="wo"
                type="text"
                value={wo}
                onChange={(e) => setWo(e.target.value)}
                placeholder="Ex: WO0000012345"
                required
              />
            </div>
            <div className="form-group">
              <label htmlFor="uf">UF</label>
              <input
                id="uf"
                type="text"
                value={uf}
                onChange={(e) => setUf(e.target.value.toUpperCase())}
                placeholder="Ex: SP / SPI"
                maxLength={3}
                required
              />
            </div>
            <div className="form-group">
              <label htmlFor="status">Finalizado como</label>
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
            {status === 'Concluído' && (
              <div className="form-group checkbox-container">
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    checked={isPresencial}
                    onChange={(e) => setIsPresencial(e.target.checked)}
                  />
                  Marcar como Presencial
                </label>
              </div>
            )}
            <button type="submit">Adicionar Chamado</button>
          </div>
        </form>
      </section>

      <section className="controls-container">
        <div className="filter-group">
          <div className="filter-container" aria-label="Filtrar chamados por status">
            {filterOptions.map(option => (
              <button
                key={option}
                className={`filter-btn ${filterStatus === option ? 'active' : ''}`}
                onClick={() => setFilterStatus(option)}
                aria-pressed={filterStatus === option}
              >
                {option === 'All' ? 'Todos' : option}
              </button>
            ))}
          </div>
          {filterStatus !== 'All' && (
            <div className="filter-total-count">
              Total Encontrado: {filteredTickets.length}
            </div>
          )}
        </div>
        <div className="search-container">
          <input 
            type="text"
            placeholder="Buscar por WO..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            aria-label="Buscar chamado por WO"
          />
        </div>
      </section>
      
      <input 
        type="file" 
        ref={fileInputRef} 
        onChange={handleFileChange} 
        accept="application/json" 
        style={{ display: 'none' }} 
      />
      
      <section className="daily-goal-container">
        <div className="goal-header">
          <h3>Sua Meta Diária de Hoje</h3>
          <span>{todaysCount}/{DAILY_GOAL}</span>
        </div>
        <div className="progress-bar-container">
          <div 
            className={`progress-bar ${todaysCount >= DAILY_GOAL ? 'goal-met' : ''}`}
            style={{ width: `${progress}%` }}
            aria-valuenow={todaysCount}
            aria-valuemin={0}
            aria-valuemax={DAILY_GOAL}
          ></div>
        </div>
        <p className="goal-message">{getGoalMessage()}</p>
      </section>

      <section className="monthly-report-container">
        <h2 className="section-title">Relatório Mensal</h2>
        <div className="report-controls">
          <div className="form-group">
            <label htmlFor="report-month">Selecione o Mês</label>
            <select 
              id="report-month"
              value={selectedReportMonth} 
              onChange={e => {
                setSelectedReportMonth(e.target.value);
                setMonthlyReportData(null); // Reset report when month changes
              }}
              disabled={availableReportMonths.length === 0}
            >
              {availableReportMonths.map(monthStr => (
                <option key={monthStr} value={monthStr}>
                  {formatMonthForDisplay(monthStr)}
                </option>
              ))}
            </select>
          </div>
          <button 
            onClick={handleGenerateReport}
            disabled={availableReportMonths.length === 0}
          >
            Gerar Relatório
          </button>
        </div>
        {monthlyReportData && (
          <div className="report-summary">
            <div className="report-grid">
              <div className="report-stat">
                <span className="stat-value">{monthlyReportData.totalTickets}</span>
                <span className="stat-label">Total de Chamados</span>
              </div>
              <div className="report-stat">
                <span className="stat-value">{monthlyReportData.completedTickets}</span>
                <span className="stat-label">Chamados Concluídos</span>
              </div>
              <div className="report-stat">
                <span className="stat-value">{monthlyReportData.averagePerDay}</span>
                <span className="stat-label">Média por Dia</span>
              </div>
              <div className="report-stat">
                <span className="stat-value">{monthlyReportData.presencialCount}</span>
                <span className="stat-label">Concluídos (Presencial)</span>
              </div>
              <div className="report-stat">
                <span className="stat-value">{monthlyReportData.remotoCount}</span>
                <span className="stat-label">Concluídos (Remoto)</span>
              </div>
            </div>
            <button onClick={handleDownloadCsv} className="download-csv-btn">
              Baixar CSV
            </button>
          </div>
        )}
      </section>

      <section className="ticket-list-container" aria-labelledby="list-heading">
        <h2 id="list-heading" className="sr-only">Lista de Chamados Adicionados</h2>
        {tickets.length > 0 ? (
          sortedDateKeys.length > 0 ? (
            sortedDateKeys.map(dateKey => (
              <div key={dateKey} className="date-group">
                <h3 className="date-group-header">
                  <span>{formatDateHeader(dateKey)}</span>
                </h3>
                <div className="ticket-list">
                {groupedTickets[dateKey].map(ticket => (
                  <div key={ticket.id} className={`ticket-item status-${ticket.status}`}>
                    {editingTicketId === ticket.id ? (
                      <div className="ticket-edit-form">
                        <div className="form-group">
                          <label htmlFor={`edit-wo-${ticket.id}`}>WO</label>
                          <input id={`edit-wo-${ticket.id}`} type="text" value={editFormData.wo} onChange={e => setEditFormData({...editFormData, wo: e.target.value.toUpperCase()})} />
                        </div>
                        <div className="form-group">
                          <label htmlFor={`edit-uf-${ticket.id}`}>UF</label>
                          <input id={`edit-uf-${ticket.id}`} type="text" value={editFormData.uf} maxLength={3} onChange={e => setEditFormData({...editFormData, uf: e.target.value.toUpperCase()})} />
                        </div>
                        <div className="form-group">
                          <label htmlFor={`edit-status-${ticket.id}`}>Status</label>
                          <select id={`edit-status-${ticket.id}`} value={editFormData.status} onChange={e => setEditFormData({...editFormData, status: e.target.value as Ticket['status']})}>
                            {statusOptions.map(option => <option key={option} value={option}>{option}</option>)}
                          </select>
                        </div>
                        {editFormData.status === 'Concluído' && (
                          <div className="form-group">
                            <label className="checkbox-label">
                              <input
                                type="checkbox"
                                checked={editFormData.isPresencial || false}
                                onChange={(e) => setEditFormData({ ...editFormData, isPresencial: e.target.checked })}
                              />
                              Marcar como Presencial
                            </label>
                          </div>
                        )}
                        <div className="edit-actions">
                          <button onClick={() => handleSave(ticket.id)} className="save-btn">Salvar</button>
                          <button onClick={handleCancelEdit} className="cancel-btn">Cancelar</button>
                        </div>
                      </div>
                    ) : (
                      <>
                        <div className="ticket-details">
                          <div className="ticket-row-top">
                            <p className="wo">{ticket.wo}</p>
                            <p className="uf">{ticket.uf}</p>
                          </div>
                          <div className="ticket-row-bottom">
                            <p className="timestamp">{parseTimestamp(ticket.timestamp).toLocaleString('pt-BR')}</p>
                            <p className={`status`}>{ticket.status}</p>
                            {ticket.isPresencial && (
                                <span className="presencial-tag">Presencial</span>
                            )}
                            {(ticket.status === 'Diagnóstico' || ticket.status === 'Trabalhado' || ticket.status === 'Cancelado') && (
                              <span className="otrs-tag">OTRS</span>
                            )}
                          </div>
                        </div>
                        <div className="ticket-actions-container">
                            <button onClick={() => toggleActionsMenu(ticket.id)} className="actions-trigger-btn" aria-label={`Ações para o chamado ${ticket.wo}`} aria-haspopup="true" aria-expanded={actionsMenuId === ticket.id}>
                              &#x22EE;
                            </button>
                            {actionsMenuId === ticket.id && (
                              <div className="actions-menu" role="menu">
                                <button onClick={() => handleCopyWo(ticket.wo)} role="menuitem">Copiar WO</button>
                                <button onClick={() => handleEdit(ticket)} role="menuitem">Editar</button>
                                <button onClick={() => handleDelete(ticket.id)} className="delete-action" role="menuitem">Excluir</button>
                              </div>
                            )}
                        </div>
                      </>
                    )}
                  </div>
                ))}
                </div>
              </div>
            ))
          ) : (
            <div className="empty-state card-style">
              <p>Nenhum chamado encontrado com os filtros aplicados.</p>
            </div>
          )
        ) : (
          <div className="empty-state card-style">
            <p>Nenhum chamado adicionado ainda. Comece preenchendo o formulário acima.</p>
          </div>
        )}
      </section>
      
      <div className={`toast ${toast.type} ${toast.message ? 'show' : ''}`} role="alert" aria-live="assertive">
        {toast.message}
      </div>
    </main>
  );
};

const container = document.getElementById('root');
const root = createRoot(container!);
root.render(<App />);