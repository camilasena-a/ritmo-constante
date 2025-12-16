import PDFDocument from 'pdfkit';
import ExcelJS from 'exceljs';
import { format } from 'date-fns';

/**
 * Formata minutos para formato legível (horas e minutos)
 */
const formatTime = (minutes) => {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  if (hours > 0) {
    return `${hours}h ${mins}min`;
  }
  return `${mins}min`;
};

/**
 * Formata porcentagem
 */
const formatPercent = (value) => {
  if (value === null || value === undefined) return '0%';
  return `${(value * 100).toFixed(1)}%`;
};

/**
 * Gera PDF com estatísticas de desempenho
 */
export const generatePDF = async (data) => {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ margin: 50 });
      const chunks = [];

      doc.on('data', (chunk) => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);

      // Cabeçalho
      doc.fontSize(24).text('Relatório de Desempenho', { align: 'center' });
      doc.moveDown();
      
      const periodText = data.period === 7 ? '7 dias' : data.period === 30 ? '30 dias' : data.period === 90 ? '90 dias' : `${data.period} dias`;
      doc.fontSize(12).text(`Período: Últimos ${periodText}`, { align: 'center' });
      doc.text(`Gerado em: ${format(new Date(), "dd/MM/yyyy 'às' HH:mm")}`, { align: 'center' });
      doc.moveDown(2);

      // Visão Geral
      doc.fontSize(18).text('Visão Geral', { underline: true });
      doc.moveDown();
      
      doc.fontSize(12);
      doc.text(`Tempo Total Estudado: ${formatTime(data.overview.totalTime)}`);
      doc.text(`Total de Questões: ${data.overview.totalQuestions}`);
      doc.text(`Total de Acertos: ${data.overview.totalCorrect}`);
      doc.text(`Taxa de Acerto: ${formatPercent(data.overview.accuracy)}`);
      doc.text(`Dias Estudados: ${data.overview.daysStudied}`);
      doc.text(`Sequência Atual: ${data.overview.streak} dias`);
      doc.moveDown(2);

      // Estatísticas por Matéria
      if (data.bySubject && data.bySubject.length > 0) {
        doc.fontSize(18).text('Estatísticas por Matéria', { underline: true });
        doc.moveDown();

        data.bySubject.forEach((item, index) => {
          doc.fontSize(14).text(`${index + 1}. ${item.subject.name}`);
          doc.fontSize(11);
          doc.text(`   Tempo: ${formatTime(item.totalTime)}`);
          doc.text(`   Questões: ${item.totalQuestions}`);
          doc.text(`   Acertos: ${item.totalCorrect}`);
          doc.text(`   Taxa de Acerto: ${formatPercent(item.accuracy)}`);
          doc.text(`   Sessões: ${item.sessionsCount}`);
          doc.moveDown();
        });
        doc.moveDown();
      }

      // Evolução Temporal
      if (data.timeline && data.timeline.length > 0) {
        doc.fontSize(18).text('Evolução Temporal', { underline: true });
        doc.moveDown();
        doc.fontSize(11);

        // Agrupar por semana se houver muitos dados
        const showDetailed = data.timeline.length <= 30;
        
        if (showDetailed) {
          data.timeline.forEach((item) => {
            const date = format(new Date(item.date), 'dd/MM/yyyy');
            doc.text(`${date}: ${formatTime(item.totalTime)} | ${item.totalQuestions} questões | ${formatPercent(item.accuracy)}`);
          });
        } else {
          // Resumo semanal
          const weeklyData = {};
          data.timeline.forEach((item) => {
            const date = new Date(item.date);
            const weekStart = format(new Date(date.setDate(date.getDate() - date.getDay())), 'dd/MM/yyyy');
            if (!weeklyData[weekStart]) {
              weeklyData[weekStart] = { totalTime: 0, totalQuestions: 0, totalCorrect: 0 };
            }
            weeklyData[weekStart].totalTime += item.totalTime;
            weeklyData[weekStart].totalQuestions += item.totalQuestions;
            weeklyData[weekStart].totalCorrect += item.totalCorrect;
          });

          Object.entries(weeklyData).forEach(([week, stats]) => {
            const accuracy = stats.totalQuestions > 0 ? stats.totalCorrect / stats.totalQuestions : 0;
            doc.text(`Semana de ${week}: ${formatTime(stats.totalTime)} | ${stats.totalQuestions} questões | ${formatPercent(accuracy)}`);
          });
        }
        doc.moveDown();
      }

      // Rodapé
      doc.moveDown();
      doc.fontSize(10).text('Ritmo Constante - Sistema de Gestão de Estudos', { align: 'center' });

      doc.end();
    } catch (error) {
      reject(error);
    }
  });
};

/**
 * Gera arquivo Excel com estatísticas de desempenho
 */
export const generateExcel = async (data) => {
  const workbook = new ExcelJS.Workbook();
  
  // Estilo para cabeçalhos
  const headerStyle = {
    font: { bold: true, color: { argb: 'FFFFFFFF' } },
    fill: {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF0EA5E9' }
    },
    alignment: { horizontal: 'center', vertical: 'middle' },
    border: {
      top: { style: 'thin' },
      left: { style: 'thin' },
      bottom: { style: 'thin' },
      right: { style: 'thin' }
    }
  };

  // Aba 1: Visão Geral
  const overviewSheet = workbook.addWorksheet('Visão Geral');
  
  overviewSheet.columns = [
    { header: 'Métrica', key: 'metric', width: 30 },
    { header: 'Valor', key: 'value', width: 30 }
  ];

  const periodText = data.period === 7 ? '7 dias' : data.period === 30 ? '30 dias' : data.period === 90 ? '90 dias' : `${data.period} dias`;
  
  overviewSheet.addRow({ metric: 'Período', value: `Últimos ${periodText}` });
  overviewSheet.addRow({ metric: 'Data de Geração', value: format(new Date(), "dd/MM/yyyy 'às' HH:mm") });
  overviewSheet.addRow({ metric: 'Tempo Total Estudado', value: formatTime(data.overview.totalTime) });
  overviewSheet.addRow({ metric: 'Total de Questões', value: data.overview.totalQuestions });
  overviewSheet.addRow({ metric: 'Total de Acertos', value: data.overview.totalCorrect });
  overviewSheet.addRow({ metric: 'Taxa de Acerto', value: formatPercent(data.overview.accuracy) });
  overviewSheet.addRow({ metric: 'Dias Estudados', value: data.overview.daysStudied });
  overviewSheet.addRow({ metric: 'Sequência Atual (Streak)', value: `${data.overview.streak} dias` });

  // Aplicar estilo ao cabeçalho
  overviewSheet.getRow(1).eachCell((cell) => {
    cell.style = headerStyle;
  });

  // Aba 2: Por Matéria
  if (data.bySubject && data.bySubject.length > 0) {
    const bySubjectSheet = workbook.addWorksheet('Por Matéria');
    
    bySubjectSheet.columns = [
      { header: 'Matéria', key: 'subject', width: 30 },
      { header: 'Tempo', key: 'time', width: 20 },
      { header: 'Questões', key: 'questions', width: 15 },
      { header: 'Acertos', key: 'correct', width: 15 },
      { header: 'Taxa de Acerto', key: 'accuracy', width: 18 },
      { header: 'Sessões', key: 'sessions', width: 15 }
    ];

    data.bySubject.forEach((item) => {
      bySubjectSheet.addRow({
        subject: item.subject.name,
        time: formatTime(item.totalTime),
        questions: item.totalQuestions,
        correct: item.totalCorrect,
        accuracy: formatPercent(item.accuracy),
        sessions: item.sessionsCount
      });
    });

    // Aplicar estilo ao cabeçalho
    bySubjectSheet.getRow(1).eachCell((cell) => {
      cell.style = headerStyle;
    });

    // Adicionar bordas às células de dados
    bySubjectSheet.eachRow((row, rowNumber) => {
      if (rowNumber > 1) {
        row.eachCell((cell) => {
          cell.border = {
            top: { style: 'thin' },
            left: { style: 'thin' },
            bottom: { style: 'thin' },
            right: { style: 'thin' }
          };
        });
      }
    });
  }

  // Aba 3: Evolução Temporal
  if (data.timeline && data.timeline.length > 0) {
    const timelineSheet = workbook.addWorksheet('Evolução Temporal');
    
    timelineSheet.columns = [
      { header: 'Data', key: 'date', width: 15 },
      { header: 'Tempo Estudado', key: 'time', width: 20 },
      { header: 'Questões', key: 'questions', width: 15 },
      { header: 'Acertos', key: 'correct', width: 15 },
      { header: 'Taxa de Acerto', key: 'accuracy', width: 18 },
      { header: 'Sessões', key: 'sessions', width: 15 }
    ];

    data.timeline.forEach((item) => {
      timelineSheet.addRow({
        date: format(new Date(item.date), 'dd/MM/yyyy'),
        time: formatTime(item.totalTime),
        questions: item.totalQuestions,
        correct: item.totalCorrect,
        accuracy: formatPercent(item.accuracy),
        sessions: item.sessions
      });
    });

    // Aplicar estilo ao cabeçalho
    timelineSheet.getRow(1).eachCell((cell) => {
      cell.style = headerStyle;
    });

    // Adicionar bordas às células de dados
    timelineSheet.eachRow((row, rowNumber) => {
      if (rowNumber > 1) {
        row.eachCell((cell) => {
          cell.border = {
            top: { style: 'thin' },
            left: { style: 'thin' },
            bottom: { style: 'thin' },
            right: { style: 'thin' }
          };
        });
      }
    });
  }

  // Gerar buffer
  const buffer = await workbook.xlsx.writeBuffer();
  return buffer;
};

