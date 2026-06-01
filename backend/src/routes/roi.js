const router = require('express').Router();
const auth = require('../middleware/auth');

// Hospital mock data
const HOSPITAL = {
  funcionarios: 320,
  salarioMedio: 3800,
  turnover: 0.28,         // 28%
  absenteismo: 0.074,     // 7.4%
  diasUteis: 22,
  meses: 12,
  fatorEncargos: 1.70,    // CLT com encargos
};

const calcMetrics = () => {
  const { funcionarios, salarioMedio, turnover, absenteismo, diasUteis, meses, fatorEncargos } = HOSPITAL;
  const folhaAnual = funcionarios * salarioMedio * 13.3 * fatorEncargos; // 13.3 = 13º + férias proporcionais
  const desligamentos = Math.round(funcionarios * turnover);
  const custoTurnover = desligamentos * 3 * salarioMedio * fatorEncargos; // metodologia USP 2016

  const diasPerdidos = Math.round(funcionarios * diasUteis * meses * absenteismo);
  const salarioDia = salarioMedio / diasUteis;
  const custoAbsenteismo = Math.round(diasPerdidos * salarioDia + diasPerdidos * salarioDia * 0.30); // 30% HE cobertura

  const multasNR1 = funcionarios * 6708; // trabalhadores expostos × R$6.708
  const passivoTrabalhista = Math.round(folhaAnual * 0.02); // 2% folha

  const totalExposicao = custoTurnover + custoAbsenteismo + multasNR1 + passivoTrabalhista;

  // ROI por camada de investimento
  const layers = [
    { nome: 'Diagnóstico Psicossocial (COPSOQ-II)', investimento: 15000, reducaoTurnover: 0.05, reducaoAbsenteismo: 0.01 },
    { nome: 'Treinamentos NR-1 + Liderança', investimento: 48000, reducaoTurnover: 0.08, reducaoAbsenteismo: 0.015 },
    { nome: 'Suporte Psicológico Plantonista', investimento: 102000, reducaoTurnover: 0.10, reducaoAbsenteismo: 0.02 },
    { nome: 'Reestruturação de Escalas', investimento: 216000, reducaoTurnover: 0.15, reducaoAbsenteismo: 0.03 },
    { nome: 'Programa Completo PULSO', investimento: 381000, reducaoTurnover: 0.20, reducaoAbsenteismo: 0.04 },
  ];

  const payback = layers.map(l => {
    const economiaAnual = Math.round(
      desligamentos * l.reducaoTurnover * 3 * salarioMedio * fatorEncargos +
      diasPerdidos * l.reducaoAbsenteismo * salarioDia * 12
    );
    const paybackMeses = economiaAnual > 0 ? Math.round((l.investimento / economiaAnual) * 12) : 999;
    const roi = economiaAnual > 0 ? Math.round(((economiaAnual - l.investimento) / l.investimento) * 100) : 0;
    return { ...l, economiaAnual, paybackMeses, roi };
  });

  // Por setor
  const setores = [
    { setor: 'UTI', turnoverSetor: 0.38, colaboradores: 68, riscoPredominante: 'Crítico' },
    { setor: 'Pronto-socorro', turnoverSetor: 0.32, colaboradores: 74, riscoPredominante: 'Crítico' },
    { setor: 'Internação', turnoverSetor: 0.25, colaboradores: 82, riscoPredominante: 'Alto' },
    { setor: 'Centro Cirúrgico', turnoverSetor: 0.22, colaboradores: 54, riscoPredominante: 'Médio' },
    { setor: 'Administrativo', turnoverSetor: 0.12, colaboradores: 42, riscoPredominante: 'Baixo' },
  ].map(s => ({
    ...s,
    desligamentos: Math.round(s.colaboradores * s.turnoverSetor),
    custoAnual: Math.round(s.colaboradores * s.turnoverSetor * 3 * salarioMedio * fatorEncargos),
  }));

  // Tendência (simulada para 6 meses)
  const trend = Array.from({ length: 6 }, (_, i) => ({
    mes: ['Jan','Fev','Mar','Abr','Mai','Jun'][i],
    turnover: +(HOSPITAL.turnover * 100 - i * 0.3 + (i % 2 === 0 ? 0.5 : -0.2)).toFixed(1),
    absenteismo: +(HOSPITAL.absenteismo * 100 - i * 0.1).toFixed(1),
    custoMensal: Math.round(custoTurnover / 12 + custoAbsenteismo / 12 - i * 5000),
  }));

  return {
    folhaAnual: Math.round(folhaAnual),
    desligamentos,
    custoTurnover,
    diasPerdidos,
    custoAbsenteismo,
    multasNR1,
    passivoTrabalhista,
    totalExposicao,
    payback,
    setores,
    trend,
  };
};

router.get('/metrics', auth, (req, res) => {
  res.json(calcMetrics());
});

module.exports = router;
