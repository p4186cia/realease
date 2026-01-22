
import { Militar, Bairro, OcorrenciaForm } from '../types';

/**
 * COPIE ESTE CÓDIGO PARA O APPS SCRIPT DA SUA PLANILHA
 * --------------------------------------------------
 * 
 * function doPost(e) {
 *   const ss = SpreadsheetApp.openById('16JnE2TtAGCYnfz8RQ933v_z7bKEOqG57ALWnIOLv3bw');
 *   const sheet = ss.getSheetByName('RELEASE') || ss.insertSheet('RELEASE');
 *   
 *   if (sheet.getLastRow() === 0) {
 *     sheet.appendRow(['Data/Hora', 'Equipe', 'Viatura(s)', 'Local', 'Bairro', 'Setor', 'Oficial', 'Histórico', 'Produtividade', 'Possui Foto?']);
 *   }
 *   
 *   const data = JSON.parse(e.postData.contents);
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
 *     data.temFoto
 *   ]);
 *   
 *   return ContentService.createTextOutput(JSON.stringify({status: 'success'}))
 *     .setMimeType(ContentService.MimeType.JSON);
 * }
 * 
 * function doGet() {
 *   const ss = SpreadsheetApp.openById('16JnE2TtAGCYnfz8RQ933v_z7bKEOqG57ALWnIOLv3bw');
 *   const militares = ss.getSheetByName('MILITARES').getDataRange().getValues();
 *   const bairros = ss.getSheetByName('BAIRRO').getDataRange().getValues();
 *   const result = { militares, bairros };
 *   return ContentService.createTextOutput(JSON.stringify(result))
 *     .setMimeType(ContentService.MimeType.JSON);
 * }
 */

// IMPORTANTE: Substitua pela URL que o Google vai te dar ao "Implantar" o script acima
const GAS_WEBAPP_URL = 'https://script.google.com/macros/s/SUA_URL_GERADA_AQUI/exec';
const SHEET_ID = '16JnE2TtAGCYnfz8RQ933v_z7bKEOqG57ALWnIOLv3bw';

export async function loadAppData() {
  try {
    // No Netlify, tentamos carregar via GAS Web App primeiro para dados atualizados
    // Se a URL não estiver configurada, usamos o fallback de visualização pública (gviz)
    let url = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?tqx=out:csv&sheet=`;
    
    const fetchSheet = async (name: string) => {
      const resp = await fetch(url + encodeURIComponent(name));
      const text = await resp.text();
      return parseCSV(text);
    };

    const [milRaw, baiRaw] = await Promise.all([
      fetchSheet('MILITARES'),
      fetchSheet('BAIRRO')
    ]);

    const militares: Militar[] = milRaw.slice(1).map(row => ({
      numeroPM: String(row[1] || ''),
      pg: String(row[2] || ''),
      nomeGuerra: String(row[4] || '')
    })).filter(m => m.numeroPM);

    const bairros: Bairro[] = baiRaw.slice(1).map(row => ({
      nome: String(row[0] || ''),
      oficialSetor: String(row[2] || ''),
      telefoneComandante: String(row[3] || ''),
      setor: String(row[1] || 'SETOR')
    })).filter(b => b.nome);

    return { militares, bairros };
  } catch (error) {
    console.error('Erro ao carregar dados:', error);
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
    temFoto: data.foto ? 'SIM' : 'NÃO'
  };

  // Envio via POST para o Web App (compatível com Netlify)
  if (GAS_WEBAPP_URL.includes('SUA_URL_GERADA')) {
    console.warn('URL do GAS não configurada. Salvamento apenas no console.');
    console.log('Payload:', payload);
    return;
  }

  const response = await fetch(GAS_WEBAPP_URL, {
    method: 'POST',
    mode: 'no-cors', // Importante para evitar erros de CORS em redirecionamentos do Google
    cache: 'no-cache',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });

  // Nota: com 'no-cors', o response não é legível, mas o dado chega ao Google.
  return;
}
