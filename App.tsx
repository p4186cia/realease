
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Militar, Bairro, OcorrenciaForm, AppData } from './types';
import { loadAppData, saveToRelease } from './services/sheetService';
import { optimizeReportText } from './services/geminiService';
import { 
  Shield, 
  MapPin, 
  UserCheck, 
  FileText, 
  Send, 
  RefreshCw, 
  AlertCircle,
  Smartphone,
  CheckCircle2,
  Sparkles,
  ChevronRight,
  Info,
  Plus,
  Trash2,
  CarFront,
  Search,
  Camera,
  X,
  Image as ImageIcon,
  Database,
  Check
} from 'lucide-react';

const HEADER_PMMG = `========================
           🇧🇷  2ª RPM  🇧🇷              
🔺 39º BPM - O INCANSÁVEL 🔺
              186ª CIA PM 
========================`;

const FOOTER_PMMG = `========================
POLÍCIA MILITAR DE MINAS GERAIS - 250 ANOS

A FORÇA DO POVO MINEIRO.
PRESENÇA QUE PROTEGE.
========================`;

const App: React.FC = () => {
  const [appData, setAppData] = useState<AppData>({
    militares: [],
    bairros: [],
    loading: true,
    error: null
  });

  const [formData, setFormData] = useState<OcorrenciaForm>({
    equipe: [{ numeroPM: '', pg: '', nomeGuerra: '' }],
    viaturas: [''],
    endereco: '',
    numero: '',
    bairro: null,
    cidade: 'CONTAGEM/MG',
    historico: '',
    produtividade: '',
  });

  const [isOptimizing, setIsOptimizing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [showSummary, setShowSummary] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    loadAppData()
      .then(data => setAppData({ ...data, loading: false, error: null }))
      .catch(err => setAppData(prev => ({ ...prev, loading: false, error: 'Erro de conexão com Base de Dados.' })));
  }, []);

  const handleMilitarChange = (index: number, numeroPM: string) => {
    const newEquipe = [...formData.equipe];
    const cleanPM = numeroPM.trim();
    
    newEquipe[index] = { ...newEquipe[index], numeroPM: cleanPM };

    if (cleanPM.length >= 4) {
      const found = appData.militares.find(m => m.numeroPM === cleanPM);
      if (found) {
        newEquipe[index] = { ...found };
      } else {
        newEquipe[index] = { ...newEquipe[index], pg: 'NÃO LOCALIZADO', nomeGuerra: '-' };
      }
    } else {
      newEquipe[index] = { ...newEquipe[index], pg: '', nomeGuerra: '' };
    }

    setFormData(prev => ({ ...prev, equipe: newEquipe }));
  };

  const addMilitar = () => {
    setFormData(prev => ({
      ...prev,
      equipe: [...prev.equipe, { numeroPM: '', pg: '', nomeGuerra: '' }]
    }));
  };

  const removeMilitar = (index: number) => {
    if (formData.equipe.length <= 1) return;
    const newEquipe = [...formData.equipe];
    newEquipe.splice(index, 1);
    setFormData(prev => ({ ...prev, equipe: newEquipe }));
  };

  const handleViaturaChange = (index: number, value: string) => {
    const newViaturas = [...formData.viaturas];
    newViaturas[index] = value;
    setFormData(prev => ({ ...prev, viaturas: newViaturas }));
  };

  const addViatura = () => {
    setFormData(prev => ({
      ...prev,
      viaturas: [...prev.viaturas, '']
    }));
  };

  const removeViatura = (index: number) => {
    if (formData.viaturas.length <= 1) return;
    const newViaturas = [...formData.viaturas];
    newViaturas.splice(index, 1);
    setFormData(prev => ({ ...prev, viaturas: newViaturas }));
  };

  const handleBairroChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const foundBairro = appData.bairros.find(b => b.nome === e.target.value) || null;
    setFormData(prev => ({ ...prev, bairro: foundBairro }));
  };

  const handleOptimize = async (type: 'historico' | 'produtividade') => {
    if (!formData[type]) return;
    setIsOptimizing(true);
    const optimized = await optimizeReportText(formData[type], type);
    setFormData(prev => ({ ...prev, [type]: optimized }));
    setIsOptimizing(false);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData(prev => ({ ...prev, foto: reader.result as string }));
      };
      reader.readAsDataURL(file);
    }
  };

  const removeFoto = () => {
    setFormData(prev => {
      const { foto, ...rest } = prev;
      return rest;
    });
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleFinalSubmit = async () => {
    setIsSaving(true);
    try {
      await saveToRelease(formData);
      setShowSummary(true);
    } catch (error) {
      console.error('Erro ao salvar:', error);
      alert('Erro ao sincronizar dados com a Planilha. Verifique sua conexão.');
    } finally {
      setIsSaving(false);
    }
  };

  const generateWhatsAppMessage = () => {
    const { equipe, viaturas, endereco, numero, bairro, historico, produtividade, foto } = formData;
    
    const equipeStr = equipe.map(m => `• ${m.pg} ${m.nomeGuerra} (PM ${m.numeroPM})`).join('\n');
    const viaturasStr = viaturas.filter(v => v.trim() !== '').join(', ');
    const fotoStatus = foto ? `\n📸 *FOTO ANEXADA AO RELATÓRIO*` : '';
    
    const text = `${HEADER_PMMG}\n` +
      `*RESUMO DE OCORRÊNCIA* 🚔\n` +
      `--------------------------------\n` +
      `*EQUIPE:*\n${equipeStr}\n` +
      `*VIATURA(S):* ${viaturasStr || '---'}\n\n` +
      `*LOCAL:* ${endereco}, ${numero} - ${bairro?.nome}\n` +
      `*CMT SETOR:* ${bairro?.oficialSetor}\n` +
      `--------------------------------\n` +
      `*HISTÓRICO:*\n${historico}\n\n` +
      `*PRODUTIVIDADE:*\n${produtividade}${fotoStatus}\n\n` +
      `${FOOTER_PMMG}`;

    let phone = (bairro?.telefoneComandante || '').replace(/\D/g, '');
    if (phone.length === 11 && !phone.startsWith('55')) phone = '55' + phone;
    return `https://wa.me/${phone}?text=${encodeURIComponent(text)}`;
  };

  const isFormValid = useMemo(() => (
    formData.equipe.every(m => m.numeroPM && m.pg !== 'NÃO LOCALIZADO') &&
    formData.viaturas.some(v => v.trim() !== '') &&
    formData.endereco && formData.bairro && formData.historico
  ), [formData]);

  if (appData.loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-pmmg-blue text-white overflow-hidden">
        <div className="absolute inset-0 opacity-10 pointer-events-none flex items-center justify-center">
          <Shield className="w-[500px] h-[500px]" />
        </div>
        <div className="relative z-10 flex flex-col items-center px-6">
          <div className="w-24 h-24 bg-pmmg-gold rounded-full flex items-center justify-center shadow-2xl mb-8 animate-bounce">
            <Shield className="w-12 h-12 text-pmmg-blue" />
          </div>
          <h2 className="text-2xl font-black tracking-widest uppercase text-center">Iniciando Sistemas</h2>
          <div className="mt-4 w-48 h-1.5 bg-pmmg-dark rounded-full overflow-hidden">
            <div className="h-full bg-pmmg-gold animate-[shimmer_2s_infinite] w-full"></div>
          </div>
          <p className="mt-4 text-pmmg-goldLight text-xs font-bold tracking-[0.2em] uppercase text-center">Sincronizando com Nuvem PMMG...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-40">
      {/* Header */}
      <header className="glass-header text-white sticky top-0 z-50 border-b-4 border-pmmg-gold shadow-2xl">
        <div className="max-w-4xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="p-2 bg-pmmg-gold rounded-lg shadow-inner">
              <Shield className="w-8 h-8 text-pmmg-blue" />
            </div>
            <div>
              <h1 className="text-xl font-black tracking-tight leading-none uppercase">Central de Ocorrências</h1>
              <p className="text-[10px] text-pmmg-gold font-black mt-1 tracking-widest uppercase">Polícia Militar de Minas Gerais</p>
            </div>
          </div>
          <div className="hidden sm:flex items-center gap-2 px-3 py-1 bg-green-500/20 rounded-full border border-green-500/50">
            <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
            <span className="text-[10px] font-black text-green-400 uppercase">Dados em Tempo Real</span>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto p-4 md:p-6 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
        
        {/* Banner Informativo */}
        <div className="bg-pmmg-dark rounded-2xl p-5 flex items-start gap-4 border border-pmmg-blue shadow-lg">
          <Info className="w-6 h-6 text-pmmg-gold shrink-0 mt-0.5" />
          <div className="space-y-1">
            <p className="text-xs text-pmmg-silver font-bold uppercase tracking-wider">Instruções Operacionais</p>
            <p className="text-[11px] text-slate-300 font-medium leading-relaxed">
              Informe o <span className="text-pmmg-gold font-bold">Nº PM</span> para busca automática. Os dados serão salvos na aba <span className="text-pmmg-gold font-bold">RELEASE</span> ao finalizar.
            </p>
          </div>
        </div>

        {/* 1. EQUIPE E LOGÍSTICA */}
        <section className="bg-white rounded-2xl shadow-xl overflow-hidden pmmg-card">
          <div className="bg-slate-50 px-6 py-4 border-b border-slate-100 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-pmmg-blue rounded-lg flex items-center justify-center">
                <UserCheck className="w-5 h-5 text-pmmg-gold" />
              </div>
              <h2 className="font-black text-pmmg-blue tracking-tight uppercase text-sm">01. EQUIPE E LOGÍSTICA</h2>
            </div>
            <div className="flex gap-2">
              <button 
                onClick={addMilitar}
                className="flex items-center gap-2 bg-pmmg-blue text-white px-3 py-1.5 rounded-lg text-[10px] font-black hover:bg-pmmg-dark transition-all border border-pmmg-gold/30 uppercase"
              >
                <Plus className="w-3 h-3 text-pmmg-gold" />
                Integrante
              </button>
              <button 
                onClick={addViatura}
                className="flex items-center gap-2 bg-pmmg-dark text-pmmg-gold px-3 py-1.5 rounded-lg text-[10px] font-black hover:bg-black transition-all border border-pmmg-gold/30 uppercase"
              >
                <Plus className="w-3 h-3" />
                Viatura
              </button>
            </div>
          </div>
          <div className="p-6 space-y-6">
            <div className="space-y-4">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest px-1">Composição da Guarnição</label>
              {formData.equipe.map((m, idx) => (
                <div key={idx} className="grid grid-cols-1 md:grid-cols-12 gap-4 items-end bg-slate-50 p-4 rounded-xl border border-slate-200 relative group animate-in slide-in-from-right-2">
                  <div className="md:col-span-3 space-y-1.5">
                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Nº PM {idx + 1}</label>
                    <div className="relative">
                      <input 
                        type="text"
                        placeholder="Ex: 123456"
                        className="w-full bg-white border-2 border-slate-200 rounded-lg px-3 py-2 focus:border-pmmg-blue outline-none font-black text-pmmg-blue text-sm"
                        value={m.numeroPM}
                        onChange={(e) => handleMilitarChange(idx, e.target.value)}
                      />
                      <Search className="w-4 h-4 absolute right-3 top-2.5 text-slate-300" />
                    </div>
                  </div>
                  <div className="md:col-span-3 space-y-1.5">
                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Posto/Graduação</label>
                    <div className="bg-slate-100 border-2 border-transparent rounded-lg px-3 py-2 text-pmmg-blue font-black uppercase text-sm h-[38px] flex items-center truncate">
                      {m.pg || '...'}
                    </div>
                  </div>
                  <div className="md:col-span-5 space-y-1.5">
                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Nome de Guerra</label>
                    <div className="bg-slate-100 border-2 border-transparent rounded-lg px-3 py-2 text-pmmg-blue font-black uppercase text-sm h-[38px] flex items-center truncate">
                      {m.nomeGuerra || '---'}
                    </div>
                  </div>
                  <div className="md:col-span-1 flex justify-end">
                    <button 
                      onClick={() => removeMilitar(idx)}
                      disabled={formData.equipe.length <= 1}
                      className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-0"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <div className="pt-4 border-t border-slate-100 space-y-4">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest px-1">Prefixos das Viaturas</label>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                {formData.viaturas.map((v, idx) => (
                  <div key={idx} className="flex items-center gap-2 animate-in slide-in-from-left-2">
                    <div className="relative flex-1">
                      <div className="absolute left-3 top-3 text-slate-400">
                        <CarFront className="w-4 h-4" />
                      </div>
                      <input 
                        type="text"
                        placeholder="Prefixo"
                        className="w-full bg-slate-50 border-2 border-slate-200 rounded-xl pl-9 pr-4 py-3 focus:border-pmmg-blue focus:bg-white transition-all outline-none font-black text-pmmg-blue uppercase"
                        value={v}
                        onChange={(e) => handleViaturaChange(idx, e.target.value)}
                      />
                    </div>
                    <button 
                      onClick={() => removeViatura(idx)}
                      disabled={formData.viaturas.length <= 1}
                      className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-30 disabled:grayscale"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* 2. LOCALIZAÇÃO */}
        <section className="bg-white rounded-2xl shadow-xl overflow-hidden pmmg-card">
          <div className="bg-slate-50 px-6 py-4 border-b border-slate-100 flex items-center gap-3">
            <div className="w-8 h-8 bg-pmmg-blue rounded-lg flex items-center justify-center">
              <MapPin className="w-5 h-5 text-pmmg-gold" />
            </div>
            <h2 className="font-black text-pmmg-blue tracking-tight uppercase text-sm">02. LOCALIZAÇÃO DO FATO</h2>
          </div>
          <div className="p-6 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="md:col-span-3 space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Endereço / Logradouro</label>
                <input 
                  type="text"
                  placeholder="Ex: Avenida João César de Oliveira"
                  className="w-full bg-slate-50 border-2 border-slate-200 rounded-xl px-4 py-3 focus:border-pmmg-blue focus:bg-white transition-all outline-none font-medium"
                  value={formData.endereco}
                  onChange={(e) => setFormData(prev => ({ ...prev, endereco: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Número</label>
                <input 
                  type="text"
                  placeholder="S/N"
                  className="w-full bg-slate-50 border-2 border-slate-200 rounded-xl px-4 py-3 focus:border-pmmg-blue focus:bg-white transition-all outline-none font-bold"
                  value={formData.numero}
                  onChange={(e) => setFormData(prev => ({ ...prev, numero: e.target.value }))}
                />
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Bairro (Base Territorial)</label>
                <select 
                  className="w-full bg-slate-50 border-2 border-slate-200 rounded-xl px-4 py-3 focus:border-pmmg-blue focus:bg-white transition-all outline-none font-bold text-pmmg-blue"
                  onChange={handleBairroChange}
                  value={formData.bairro?.nome || ''}
                >
                  <option value="">Selecione o Bairro</option>
                  {appData.bairros.map(b => (
                    <option key={b.nome} value={b.nome}>{b.nome}</option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Cidade</label>
                <div className="bg-slate-100 border-2 border-transparent rounded-xl px-4 py-3 text-slate-500 font-black uppercase">
                  {formData.cidade}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* 3. COMANDO DO SETOR */}
        <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
           <div className="bg-pmmg-blue rounded-2xl p-6 shadow-xl border-b-4 border-pmmg-gold relative overflow-hidden group">
              <div className="absolute right-[-20px] top-[-20px] opacity-10 group-hover:scale-110 transition-transform duration-500">
                <Shield className="w-32 h-32" />
              </div>
              <p className="text-[10px] font-black text-pmmg-gold uppercase tracking-[0.2em] mb-4">Oficial do Setor</p>
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-pmmg-gold rounded-xl flex items-center justify-center shadow-lg">
                   <UserCheck className="w-6 h-6 text-pmmg-blue" />
                </div>
                <div>
                   <h4 className="text-white font-black text-lg tracking-tight leading-none uppercase">
                     {formData.bairro?.oficialSetor || 'NÃO DEFINIDO'}
                   </h4>
                   <p className="text-pmmg-goldLight text-[10px] font-bold mt-1 uppercase tracking-tighter">Responsável pela Área</p>
                </div>
              </div>
           </div>

           <div className="bg-pmmg-dark rounded-2xl p-6 shadow-xl border-b-4 border-pmmg-gold relative overflow-hidden group">
              <p className="text-[10px] font-black text-pmmg-gold uppercase tracking-[0.2em] mb-4">Comunicação Direta</p>
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-pmmg-gold/20 border border-pmmg-gold/50 rounded-xl flex items-center justify-center shadow-lg">
                   <Smartphone className="w-6 h-6 text-pmmg-gold" />
                </div>
                <div>
                   <h4 className="text-white font-black text-lg tracking-tight leading-none">
                     {formData.bairro?.telefoneComandante || '(00) 00000-0000'}
                   </h4>
                   <p className="text-pmmg-goldLight text-[10px] font-bold mt-1 uppercase tracking-tighter">Cmt do Setor</p>
                </div>
              </div>
           </div>
        </section>

        {/* 4. HISTÓRICO E PRODUTIVIDADE */}
        <section className="bg-white rounded-2xl shadow-xl overflow-hidden pmmg-card">
          <div className="bg-slate-50 px-6 py-4 border-b border-slate-100 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-pmmg-blue rounded-lg flex items-center justify-center">
                <FileText className="w-5 h-5 text-pmmg-gold" />
              </div>
              <h2 className="font-black text-pmmg-blue tracking-tight uppercase text-sm">03. RELATO DOS FATOS</h2>
            </div>
            <div className="hidden md:flex items-center gap-2 px-3 py-1 bg-pmmg-blue text-pmmg-gold rounded-full text-[10px] font-black shadow-lg">
              <Sparkles className="w-3 h-3" />
              INTELIGÊNCIA ARTIFICIAL
            </div>
          </div>
          <div className="p-6 space-y-8">
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Histórico Técnico</label>
                <div className="flex gap-2">
                  <button 
                    onClick={() => handleOptimize('historico')}
                    disabled={isOptimizing || !formData.historico}
                    className="flex items-center gap-2 bg-pmmg-blue text-pmmg-gold px-4 py-2 rounded-xl text-[10px] font-black hover:bg-pmmg-dark transition-all disabled:opacity-30 shadow-md border border-pmmg-gold/30 uppercase"
                  >
                    {isOptimizing ? <RefreshCw className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3" />}
                    Otimizar com IA
                  </button>
                </div>
              </div>
              <textarea 
                rows={8}
                placeholder="Insira o relato completo da ocorrência..."
                className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl px-5 py-4 focus:border-pmmg-blue focus:bg-white transition-all outline-none text-sm leading-relaxed text-slate-700 shadow-inner"
                value={formData.historico}
                onChange={(e) => setFormData(prev => ({ ...prev, historico: e.target.value }))}
              />
            </div>

            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Produtividade Operacional</label>
                <button 
                  onClick={() => handleOptimize('produtividade')}
                  disabled={isOptimizing || !formData.produtividade}
                  className="flex items-center gap-2 bg-pmmg-blue text-pmmg-gold px-4 py-2 rounded-xl text-[10px] font-black hover:bg-pmmg-dark transition-all disabled:opacity-30 shadow-md border border-pmmg-gold/30 uppercase"
                >
                  {isOptimizing ? <RefreshCw className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3" />}
                  Formatar IA
                </button>
              </div>
              <textarea 
                rows={3}
                placeholder="Ex: Armas, Drogas, Presos, Veículos Recuperados..."
                className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl px-5 py-4 focus:border-pmmg-blue focus:bg-white transition-all outline-none text-sm font-bold text-pmmg-blue shadow-inner"
                value={formData.produtividade}
                onChange={(e) => setFormData(prev => ({ ...prev, produtividade: e.target.value }))}
              />
            </div>

            {/* ANEXO DE FOTO */}
            <div className="pt-6 border-t border-slate-100 space-y-4">
               <div className="flex justify-between items-center">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Registro Fotográfico</label>
                  {!formData.foto && (
                    <button 
                      onClick={() => fileInputRef.current?.click()}
                      className="flex items-center gap-2 bg-pmmg-dark text-pmmg-gold px-4 py-2 rounded-xl text-[10px] font-black hover:bg-black transition-all shadow-md border border-pmmg-gold/30 uppercase"
                    >
                      <Camera className="w-3 h-3" />
                      Anexar Foto
                    </button>
                  )}
               </div>

               <input 
                  type="file" 
                  accept="image/*" 
                  className="hidden" 
                  ref={fileInputRef} 
                  onChange={handleFileChange}
               />

               {formData.foto ? (
                 <div className="relative w-full aspect-video md:w-64 bg-slate-100 rounded-2xl overflow-hidden shadow-lg group border-2 border-pmmg-gold/20">
                    <img 
                      src={formData.foto} 
                      alt="Anexo da Ocorrência" 
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                       <button 
                        onClick={removeFoto}
                        className="bg-red-600 text-white p-3 rounded-full shadow-xl hover:scale-110 transition-transform"
                       >
                         <Trash2 className="w-5 h-5" />
                       </button>
                    </div>
                    <div className="absolute top-2 left-2 bg-pmmg-gold text-pmmg-blue px-2 py-1 rounded-md text-[8px] font-black uppercase tracking-tighter">
                       IMG_ANEXO_PMMG
                    </div>
                 </div>
               ) : (
                 <div 
                   onClick={() => fileInputRef.current?.click()}
                   className="w-full h-32 border-2 border-dashed border-slate-200 rounded-2xl flex flex-col items-center justify-center gap-2 cursor-pointer hover:border-pmmg-gold hover:bg-slate-50 transition-all text-slate-400 group"
                 >
                    <ImageIcon className="w-8 h-8 group-hover:text-pmmg-gold transition-colors" />
                    <span className="text-[10px] font-black uppercase tracking-widest">Nenhuma foto selecionada</span>
                 </div>
               )}
            </div>
          </div>
        </section>

        {!isFormValid && (
          <div className="bg-amber-100 border-l-8 border-pmmg-gold p-5 flex gap-4 rounded-r-2xl shadow-lg animate-pulse">
            <AlertCircle className="w-8 h-8 text-pmmg-gold shrink-0" />
            <div>
              <p className="text-xs font-black text-pmmg-blue uppercase tracking-widest leading-none mb-1">Bloqueio de Segurança</p>
              <p className="text-sm text-pmmg-dark font-medium leading-tight">
                Complete os dados da <span className="font-bold underline">equipe</span>, pelo menos uma <span className="font-bold underline">viatura</span>, o <span className="font-bold underline">bairro</span> e o <span className="font-bold underline">histórico</span>.
              </p>
            </div>
          </div>
        )}
      </main>

      {/* Footer Actions */}
      <footer className="fixed bottom-0 inset-x-0 glass-header border-t-4 border-pmmg-gold p-6 shadow-[0_-20px_40px_rgba(0,0,0,0.3)] z-40">
        <div className="max-w-4xl mx-auto">
          <button 
            disabled={!isFormValid || isSaving}
            onClick={handleFinalSubmit}
            className="w-full bg-pmmg-gold text-pmmg-blue py-5 rounded-2xl flex items-center justify-center gap-4 hover:brightness-110 transition-all disabled:opacity-20 disabled:grayscale font-black text-xl tracking-tighter uppercase shadow-[0_0_20px_rgba(197,160,89,0.3)]"
          >
            {isSaving ? (
              <>
                <RefreshCw className="w-7 h-7 animate-spin" />
                SINCRONIZANDO RELEASE...
              </>
            ) : (
              <>
                <CheckCircle2 className="w-7 h-7" />
                GERAR RESUMO FINAL
                <ChevronRight className="w-6 h-6" />
              </>
            )}
          </button>
        </div>
      </footer>

      {/* Modal Summary */}
      {showSummary && (
        <div className="fixed inset-0 bg-pmmg-dark/95 backdrop-blur-xl z-[100] flex items-center justify-center p-4">
          <div className="bg-white rounded-[2.5rem] w-full max-w-2xl shadow-[0_30px_60px_-15px_rgba(0,0,0,0.5)] overflow-hidden animate-in zoom-in-95 duration-300">
            <div className="bg-pmmg-blue p-8 text-white flex justify-between items-center border-b-8 border-pmmg-gold">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 bg-pmmg-gold rounded-2xl flex items-center justify-center shadow-lg">
                   <Send className="w-7 h-7 text-pmmg-blue" />
                </div>
                <div>
                   <h3 className="font-black text-2xl tracking-tighter uppercase leading-none">Confirmação de Resumo</h3>
                   <div className="flex items-center gap-2 mt-2">
                     <p className="text-pmmg-gold font-bold text-[10px] tracking-[0.3em] uppercase leading-none">Salvo na Planilha</p>
                     <div className="bg-green-500 rounded-full p-0.5">
                       <Check className="w-2.5 h-2.5 text-white" />
                     </div>
                   </div>
                </div>
              </div>
              <button onClick={() => setShowSummary(false)} className="text-pmmg-gold/50 hover:text-white transition-colors text-2xl p-2">✕</button>
            </div>
            <div className="p-8 space-y-6">
              <div className="bg-slate-50 border-4 border-slate-100 rounded-3xl p-6 text-[13px] font-bold text-slate-800 whitespace-pre-wrap leading-relaxed max-h-[45vh] overflow-y-auto shadow-inner relative">
                <div className="absolute top-4 right-4 opacity-5 pointer-events-none text-pmmg-blue">
                  <Shield className="w-32 h-32" />
                </div>
                {HEADER_PMMG + '\n' +
                 `*RESUMO DE OCORRÊNCIA* 🚔\n` +
                 `--------------------------------\n` +
                 `*EQUIPE:*\n${formData.equipe.map(m => `• ${m.pg} ${m.nomeGuerra} (PM ${m.numeroPM})`).join('\n')}\n` +
                 `*VIATURA(S):* ${formData.viaturas.filter(v => v.trim() !== '').join(', ') || '---'}\n\n` +
                 `*LOCAL:* ${formData.endereco}, ${formData.numero} - ${formData.bairro?.nome}\n` +
                 `*CMT SETOR:* ${formData.bairro?.oficialSetor}\n` +
                 `--------------------------------\n` +
                 `*HISTÓRICO:*\n${formData.historico}\n\n` +
                 `*PRODUTIVIDADE:*\n${formData.produtividade}` +
                 (formData.foto ? `\n\n📸 *FOTO ANEXADA AO RELATÓRIO*` : '') +
                 '\n\n' + FOOTER_PMMG}

                 {formData.foto && (
                   <div className="mt-6 border-t-2 border-slate-200 pt-6">
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                        <ImageIcon className="w-3 h-3" /> Imagem Anexa:
                      </p>
                      <img 
                        src={formData.foto} 
                        className="w-full rounded-2xl shadow-md border-4 border-white"
                        alt="Anexo Operacional"
                      />
                   </div>
                 )}
              </div>
              
              <div className="space-y-4">
                <div className="flex flex-col sm:flex-row gap-4">
                  <button 
                    onClick={() => setShowSummary(false)}
                    className="flex-1 text-slate-400 font-black py-4 border-2 border-slate-200 rounded-2xl hover:bg-slate-50 transition-colors uppercase text-xs"
                  >
                    Voltar e Editar
                  </button>
                  <a 
                    href={generateWhatsAppMessage()}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-[2] bg-green-600 hover:bg-green-700 text-white font-black py-5 rounded-2xl flex items-center justify-center gap-4 transition-all shadow-xl shadow-green-200 uppercase tracking-tight text-lg"
                  >
                    <Smartphone className="w-6 h-6" />
                    Enviar WhatsApp
                  </a>
                </div>
                {formData.foto && (
                  <p className="text-[10px] text-slate-400 text-center font-bold animate-pulse">
                    ⚠️ Lembre-se de anexar a foto manualmente no WhatsApp após o envio do texto.
                  </p>
                )}
                <div className="flex items-center justify-center gap-2 text-[10px] text-slate-400 font-black uppercase">
                   <Database className="w-3 h-3" />
                   Dados registrados na aba RELEASE
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;
