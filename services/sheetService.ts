
import { Militar, Bairro, OcorrenciaForm } from '../types';

/**
 * INSTRUÇÕES PARA O GOOGLE APPS SCRIPT (Arquivo Code.gs)
 * -----------------------------------------------------
 * 1. No seu projeto Apps Script, substitua o conteúdo do Code.gs por:
 * 
 * function doGet() {
 *   return HtmlService.createHtmlOutputFromFile('index')
 *     .setTitle('PMMG - Resumo de Ocorrência')
 *     .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL)
 *     .addMetaTag('viewport', 'width=device-width, initial-scale=1');
 * }
 * 
 * function loadSheetDataFromGAS() {
 *   const ss = SpreadsheetApp.openById('184gMlpOC-o55iaW5a_2RvXJLJd8dDGil5x0s2NuXSwM');
 *   const militares = ss.getSheetByName('MILITARES').getDataRange().getValues();
 *   const bairros = ss.getSheetByName('BAIRRO').getDataRange().getValues();
 *   return { militares, bairros };
 * }
 * 
 * function saveReleaseToSheet(data) {
 *   const ss = SpreadsheetApp.openById('184gMlpOC-o55iaW5a_2RvXJLJd8dDGil5x0s2NuXSwM');
 *   let sheet = ss.getSheetByName('RELEASE');
 *   if (!sheet) {
 *     sheet = ss.insertSheet('RELEASE');
 *     sheet.appendRow(['Data/Hora', 'Equipe', 'Viatura(s)', 'Local', 'Bairro', 'Setor', 'Oficial', 'Histórico', 'Produtividade', 'Possui Foto?']);
 *   }
 *   sheet.appendRow([
 *     data.timestamp,
 *     data.equipe,
 *     data.viaturas,
 *     data.endereco,
 *     data.bairro,
 *     data.setor,
 *     data.oficial,
 *     data.historico,
 *     data.produtividade,
 *     data.temFoto ? 'SIM' : 'NÃO'
 *   ]);
 *   return "OK";
 * }
 */

declare const google: any;

const SHEET_ID = '184gMlpOC-o55iaW5a_2RvXJLJd8dDGil5x0s2NuXSwM';

export async function loadAppData() {
  // Tenta utilizar google.script.run (ambiente Apps Script nativo)
  if (typeof google !== 'undefined' && google.script && google.script.run) {
    return new Promise<{ militares: Militar[], bairros: Bairro[] }>((resolve, reject) => {
      google.script.run
        .withSuccessHandler((result: any) => {
          // Processa MILITARES
          const militares: Militar[] = result.militares.slice(1).map((row: any) => ({
            numeroPM: String(row[1] || ''),
            pg: String(row[2] || ''),
            nomeGuerra: String(row[4] || '')
          })).filter((m: any) => m.numeroPM);

          // Processa BAIRROS
          const bairros: Bairro[] = result.bairros.slice(1).map((row: any) => ({
            nome: String(row[0] || ''),
            oficialSetor: String(row[2] || ''),
            telefoneComandante: String(row[3] || ''),
            setor: String(row[1] || 'PMMG - SETOR')
          })).filter((b: any) => b.nome);

          resolve({ militares, bairros });
        })
        .withFailureHandler(reject)
        .loadSheetDataFromGAS();
    });
  }

  // Fallback para gviz tq (Apenas para desenvolvimento fora do ambiente GAS)
  try {
    const fetchSheetData = async (sheetName: string) => {
      const url = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?tqx=out:csv&sheet=${encodeURIComponent(sheetName)}`;
      const response = await fetch(url);
      const text = await response.text();
      return parseCSV(text);
    };

    const [militaresRaw, bairrosRaw] = await Promise.all([
      fetchSheetData('MILITARES'),
      fetchSheetData('BAIRRO')
    ]);

    const militares: Militar[] = militaresRaw.slice(1).map(row => ({
      numeroPM: row[1] || '',
      pg: row[2] || '',
      nomeGuerra: row[4] || ''
    })).filter(m => m.numeroPM);

    const bairros: Bairro[] = bairrosRaw.slice(1).map(row => ({
      nome: row[0] || '',
      oficialSetor: row[2] || '',
      telefoneComandante: row[3] || '',
      setor: row[1] || 'PMMG - SETOR'
    })).filter(b => b.nome);

    return { militares, bairros };
  } catch (error) {
    console.error('Erro no carregamento dos dados:', error);
    throw error;
  }
}

function parseCSV(csvText: string): string[][] {
  const lines = csvText.split('\n');
  return lines.map(line => {
    const result = [];
    let current = '';
    let inQuotes = false;
    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      if (char === '"') inQuotes = !inQuotes;
      else if (char === ',' && !inQuotes) {
        result.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }
    result.push(current.trim());
    return result.map(val => val.replace(/^"|"$/g, ''));
  });
}

export async function saveToRelease(data: OcorrenciaForm): Promise<void> {
  const payload = {
    timestamp: new Date().toLocaleString('pt-BR'),
    equipe: data.equipe.map(m => `${m.pg} ${m.nomeGuerra} (${m.numeroPM})`).join('; '),
    viaturas: data.viaturas.filter(v => v.trim()).join(', '),
    endereco: `${data.endereco}, ${data.numero}`,
    bairro: data.bairro?.nome || '',
    setor: data.bairro?.setor || '',
    oficial: data.bairro?.oficialSetor || '',
    historico: data.historico,
    produtividade: data.produtividade,
    temFoto: !!data.foto
  };

  if (typeof google !== 'undefined' && google.script && google.script.run) {
    return new Promise((resolve, reject) => {
      google.script.run
        .withSuccessHandler((res: any) => {
          console.log('Salvo com sucesso via GAS:', res);
          resolve();
        })
        .withFailureHandler(reject)
        .saveReleaseToSheet(payload);
    });
  }

  // Fallback para console em desenvolvimento
  console.log('Salvamento simulado na aba RELEASE:', payload);
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve();
    }, 1000);
  });
}
