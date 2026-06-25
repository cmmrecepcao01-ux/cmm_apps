export const formatMS = (ms: number) => {
  const x = Math.floor(ms / 1000);
  const ss = x % 60;
  const mm = Math.floor(x / 60) % 60;
  const hh = Math.floor(x / 3600);
  return `${hh.toString().padStart(2, '0')}:${mm
    .toString()
    .padStart(2, '0')}:${ss.toString().padStart(2, '0')}`;
};

export const formatServiceList = (text: string): string => {
  if (!text) return '';
  const keywords = [
    'TROCA DE',
    'TROCA DO',
    'TROCA DA',
    'TROCAR',
    'VERIFICAÇÃO DE',
    'VERIFICAÇÃO DO',
    'VERIFICAÇÃO DA',
    'VERIFICAR',
    'REPARO DE',
    'REPARO DO',
    'REPARO DA',
    'REPARAR',
    'SUBSTITUIÇÃO DE',
    'SUBSTITUIÇÃO DO',
    'SUBSTITUIÇÃO DA',
    'SUBSTITUIR',
    'AJUSTE DE',
    'AJUSTE DO',
    'AJUSTE DA',
    'AJUSTAR',
    'LIMPEZA DE',
    'LIMPEZA DO',
    'LIMPEZA DA',
    'LIMPAR',
    'REVISÃO DE',
    'REVISÃO DO',
    'REVISÃO DA',
    'REVISAR',
    'INSTALAÇÃO DE',
    'INSTALAÇÃO DO',
    'INSTALAÇÃO DA',
    'INSTALAR',
    'REMOÇÃO DE',
    'REMOÇÃO DO',
    'REMOÇÃO DA',
    'REMOVER',
    'DESMONTAGEM DE',
    'DESMONTAGEM DO',
    'DESMONTAGEM DA',
    'DESMONTAR',
    'MONTAGEM DE',
    'MONTAGEM DO',
    'MONTAGEM DA',
    'MONTAR',
    'ALINHAMENTO DE',
    'ALINHAMENTO DO',
    'ALINHAMENTO DA',
    'ALINHAR',
    'BALANCEAMENTO DE',
    'BALANCEAMENTO DO',
    'BALANCEAMENTO DA',
    'BALANCEAR',
    'DIAGNÓSTICO DE',
    'DIAGNÓSTICO DO',
    'DIAGNÓSTICO DA',
    'DIAGNOSTICAR',
    'INSPEÇÃO DE',
    'INSPEÇÃO DO',
    'INSPEÇÃO DA',
    'INSPECIONAR',
    'REGULAGEM DE',
    'REGULAGEM DO',
    'REGULAGEM DA',
    'REGULAR',
    'SANGRIA DE',
    'SANGRIA DO',
    'SANGRIA DA',
    'SANGRAR',
    'RECARGA DE',
    'RECARGA DO',
    'RECARGA DA',
    'RECARREGAR',
    'CALIBRAGEM DE',
    'CALIBRAGEM DO',
    'CALIBRAGEM DA',
    'CALIBRAR',
    'LUBRIFICAÇÃO DE',
    'LUBRIFICAÇÃO DO',
    'LUBRIFICAÇÃO DA',
    'LUBRIFICAR',
    'APERTO DE',
    'APERTO DO',
    'APERTO DA',
    'APERTAR',
    'TESTE DE',
    'TESTE DO',
    'TESTE DA',
    'TESTAR',
  ];

  let formatted = text
    .toUpperCase()
    .trim()
    .replace(/^[•\-\*]\s*/gm, '');
  const sortedKeywords = keywords.sort((a, b) => b.length - a.length);
  sortedKeywords.forEach((keyword) => {
    const regex = new RegExp(`([^\\n])\ (${keyword})`, 'gi');
    formatted = formatted.replace(regex, '$1\n$2');
  });

  return formatted
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line.length > 0)
    .map((line) => '• ' + (!/[.;,!?]$/.test(line) ? line + '.' : line))
    .join('\n');
};
