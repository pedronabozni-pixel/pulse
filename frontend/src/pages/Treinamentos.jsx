import React, { useEffect, useState } from 'react';
import api from '../api';
import { GraduationCap, Award, Play, CheckCircle, BookOpen, Clock, X } from 'lucide-react';

const fmtH = (h) => h >= 1 ? `${h}h` : `${h * 60}min`;

export default function Treinamentos() {
  const [trainings, setTrainings] = useState([]);
  const [progress, setProgress] = useState([]);
  const [stats, setStats] = useState(null);
  const [certModal, setCertModal] = useState(null);
  const [simulating, setSimulating] = useState(null);

  const load = () => {
    api.get('/treinamentos').then(r => setTrainings(r.data));
    api.get('/treinamentos/progress').then(r => setProgress(r.data));
    api.get('/treinamentos/stats').then(r => setStats(r.data));
  };

  useEffect(() => { load(); }, []);

  const getProgress = (trainingId) => progress.find(p => p.training_id === trainingId);

  const simulate = async (trainingId, currentProgress) => {
    setSimulating(trainingId);
    const newProgress = Math.min(currentProgress + 25, 100);
    await api.put(`/treinamentos/${trainingId}/progress`, { progress: newProgress });
    load();
    setSimulating(null);
  };

  const generateCert = (training, prog) => {
    setCertModal({ training, prog });
  };

  const printCert = async () => {
    const { jsPDF } = await import('jspdf');
    const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
    const teal = [0, 77, 64];

    doc.setFillColor(...teal);
    doc.rect(0, 0, 297, 50, 'F');
    doc.setFillColor(245, 240, 232);
    doc.rect(0, 50, 297, 160, 'F');

    doc.setTextColor(255,255,255);
    doc.setFontSize(28); doc.setFont('helvetica', 'bold');
    doc.text('CERTIFICADO DE CONCLUSÃO', 148.5, 25, { align: 'center' });
    doc.setFontSize(11); doc.setFont('helvetica', 'normal');
    doc.text('PULSO — Plataforma de Gestão de Riscos Psicossociais | Hospital Regional São Lucas', 148.5, 38, { align: 'center' });

    doc.setTextColor(0,77,64);
    doc.setFontSize(13); doc.setFont('helvetica', 'normal');
    doc.text('Certificamos que', 148.5, 80, { align: 'center' });
    doc.setFontSize(24); doc.setFont('helvetica', 'bold');
    doc.text('Colaborador(a) do Hospital Regional São Lucas', 148.5, 95, { align: 'center' });
    doc.setFontSize(13); doc.setFont('helvetica', 'normal');
    doc.text('concluiu com êxito o curso:', 148.5, 110, { align: 'center' });
    doc.setFontSize(18); doc.setFont('helvetica', 'bold');
    doc.setTextColor(0,0,0);
    doc.text(certModal.training.titulo, 148.5, 125, { align: 'center', maxWidth: 250 });

    doc.setFontSize(10); doc.setFont('helvetica', 'normal');
    doc.setTextColor(100,100,100);
    doc.text(`Carga horária: ${fmtH(certModal.training.duracao_horas)} | Base legal: ${certModal.training.nr_base || certModal.training.lei_base || 'NR-1'}`, 148.5, 145, { align: 'center' });
    doc.text(`Data de conclusão: ${certModal.prog.certificate_date || new Date().toLocaleDateString('pt-BR')}`, 148.5, 153, { align: 'center' });

    doc.setDrawColor(...teal); doc.setLineWidth(0.5);
    doc.line(50, 175, 120, 175); doc.line(177, 175, 247, 175);
    doc.setFontSize(9);
    doc.text('Responsável SESMT', 85, 180, { align: 'center' });
    doc.text('Gestão de Pessoas', 212, 180, { align: 'center' });

    doc.setFontSize(8); doc.setTextColor(150,150,150);
    doc.text('Documento com validade legal conforme NR-1 §1.7 e Anexo II | PULSO v1.0', 148.5, 195, { align: 'center' });

    doc.save(`Certificado_${certModal.training.titulo.replace(/ /g,'_')}.pdf`);
    setCertModal(null);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-ink">Plataforma de Treinamentos</h1>
        <p className="text-gray-500 text-sm">NR-1 §1.7 · Anexo II · Lei 14.457/2022</p>
      </div>

      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: 'Total de cursos', value: stats.total, icon: BookOpen, color: 'text-teal-900', bg: 'bg-teal-50' },
            { label: 'Cursos obrigatórios', value: stats.required, icon: GraduationCap, color: 'text-orange-900', bg: 'bg-orange-50' },
            { label: 'Concluídos', value: stats.completed, icon: CheckCircle, color: 'text-green-700', bg: 'bg-green-50' },
            { label: 'Conformidade obrigatórios', value: `${stats.compliance}%`, icon: Award, color: 'text-coral-900', bg: 'bg-red-50' },
          ].map(({ label, value, icon: Icon, color, bg }) => (
            <div key={label} className="card p-4">
              <div className={`w-9 h-9 rounded-lg ${bg} flex items-center justify-center mb-2`}>
                <Icon className={`w-5 h-5 ${color}`} />
              </div>
              <p className="text-2xl font-bold text-ink">{value}</p>
              <p className="text-sm text-gray-500">{label}</p>
            </div>
          ))}
        </div>
      )}

      {/* Progress overview */}
      {stats && (
        <div className="card p-4">
          <div className="flex justify-between text-sm mb-2">
            <span className="font-medium text-ink">Progresso geral — cursos obrigatórios</span>
            <span className="text-gray-500">{stats.completedRequired}/{stats.required} concluídos</span>
          </div>
          <div className="w-full bg-gray-100 rounded-full h-3">
            <div className="bg-teal-900 h-3 rounded-full transition-all" style={{ width: `${stats.compliance}%` }} />
          </div>
          {stats.compliance < 100 && (
            <p className="text-xs text-orange-600 mt-2">⚠️ Conformidade incompleta pode configurar infração NR-1 §1.7</p>
          )}
        </div>
      )}

      {/* Training cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {trainings.map(t => {
          const prog = getProgress(t.id);
          const pct = prog?.progress || 0;
          const done = prog?.completed;

          return (
            <div key={t.id} className="card overflow-hidden hover:shadow-card-hover transition-all">
              <div className="h-2" style={{ backgroundColor: t.thumbnail_color }} />
              <div className="p-5">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      {t.obrigatorio ? (
                        <span className="text-xs bg-orange-100 text-orange-700 px-2 py-0.5 rounded-full font-medium">Obrigatório</span>
                      ) : (
                        <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full font-medium">Opcional</span>
                      )}
                      {done && <CheckCircle className="w-4 h-4 text-green-600 shrink-0" />}
                    </div>
                    <p className="text-xs text-gray-400">{t.categoria}</p>
                  </div>
                </div>

                <h3 className="font-semibold text-ink text-sm mb-2 leading-snug">{t.titulo}</h3>
                <p className="text-xs text-gray-500 mb-3 line-clamp-2">{t.descricao}</p>

                <div className="flex items-center gap-3 text-xs text-gray-400 mb-3">
                  <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {fmtH(t.duracao_horas)}</span>
                  {t.nr_base && <span className="text-teal-600 font-medium">{t.nr_base}</span>}
                  {t.lei_base && <span className="text-blue-600 font-medium">{t.lei_base}</span>}
                </div>

                <div className="mb-3">
                  <div className="flex justify-between text-xs text-gray-500 mb-1">
                    <span>{done ? 'Concluído' : `${pct}% completo`}</span>
                    <span>{pct}%</span>
                  </div>
                  <div className="w-full bg-gray-100 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full transition-all ${done ? 'bg-green-500' : 'bg-teal-900'}`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>

                <div className="flex gap-2">
                  {!done ? (
                    <button
                      onClick={() => simulate(t.id, pct)}
                      disabled={simulating === t.id}
                      className="btn-primary flex-1 flex items-center justify-center gap-1.5 py-2"
                    >
                      {simulating === t.id ? (
                        <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      ) : <Play className="w-3.5 h-3.5" />}
                      {pct === 0 ? 'Iniciar' : 'Continuar'} (+25%)
                    </button>
                  ) : (
                    <button
                      onClick={() => generateCert(t, prog)}
                      className="btn-primary flex-1 flex items-center justify-center gap-1.5 py-2"
                    >
                      <Award className="w-3.5 h-3.5" /> Emitir Certificado
                    </button>
                  )}
                </div>

                {prog?.certificate_date && (
                  <p className="text-xs text-gray-400 text-center mt-2">Concluído em: {prog.certificate_date}</p>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Certificate Modal */}
      {certModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-md">
            <div className="p-5 border-b border-gray-100 flex items-center justify-between">
              <h3 className="font-semibold text-ink">Emitir Certificado</h3>
              <button onClick={() => setCertModal(null)} className="p-1 hover:bg-gray-100 rounded-lg"><X className="w-4 h-4" /></button>
            </div>
            <div className="p-5 text-center space-y-4">
              <Award className="w-16 h-16 text-teal-900 mx-auto" />
              <div>
                <p className="font-semibold text-ink">{certModal.training.titulo}</p>
                <p className="text-sm text-gray-500 mt-1">{fmtH(certModal.training.duracao_horas)} · {certModal.training.categoria}</p>
                <p className="text-xs text-gray-400 mt-1">Concluído em: {certModal.prog.certificate_date}</p>
              </div>
              <div className="bg-teal-50 rounded-xl p-3">
                <p className="text-xs text-teal-700">Certificado digital com registro auditável conforme NR-1 §1.7 e Anexo II</p>
              </div>
              <div className="flex gap-3">
                <button onClick={() => setCertModal(null)} className="btn-secondary flex-1">Fechar</button>
                <button onClick={printCert} className="btn-primary flex-1">Baixar PDF</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
