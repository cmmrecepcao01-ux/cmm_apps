/**
 * Utilitários de classificação e tratamento de dados do almoxarifado
 */

export type VehicleType = 'LEVES' | 'MOTOS' | 'PESADOS' | 'GERAL';

/**
 * Classifica uma peça em uma categoria de veículo com base nas informações do catálogo.
 */
export function getVehicleType(
  brand: string,
  model: string,
  category: string,
  description: string
): VehicleType {
  const b = String(brand || '').toUpperCase().trim();
  const m = String(model || '').toUpperCase().trim();
  const c = String(category || '').toUpperCase().trim();
  const d = String(description || '').toUpperCase().trim();

  // 1. MOTOS: Marcas específicas ou menções na descrição/modelo
  if (
    b === 'YAMAHA' || 
    b === 'HONDA' || 
    b === 'TRIUMPH' ||
    m.includes('XTZ') || 
    m.includes('LANDER') || 
    m.includes('CG ') || 
    m.includes('XRE') || 
    m.includes('FAZER') ||
    m.includes('TÉNÉRÉ') ||
    d.includes('MOTO') || 
    d.includes('MOTOCICLETA') ||
    d.includes('GUIDAO MOTO') ||
    d.includes('PASTILHA DE FREIO TRASEIRA MOTO') ||
    d.includes('PASTILHA DE FREIO DIANTEIRO MOTO')
  ) {
    return 'MOTOS';
  }

  // 2. PESADOS: Caminhões, ônibus, marcas pesadas ou modelos utilitários de grande porte
  if (
    b === 'ONIBUS' || 
    b === 'MERCEDES BENZ' || 
    b === 'AGRALE' || 
    b === 'SCANIA' || 
    b === 'VOLVO' || 
    b === 'IVECO' ||
    m.includes('ONIBUS') || 
    m.includes('ÔNIBUS') || 
    m.includes('CAMINHAO') || 
    m.includes('CAMINHÃO') ||
    m.includes('MICRO') || 
    m.includes('TRATOR') || 
    m.includes('SPRINTER') || 
    m.includes('DUCATO') || 
    m.includes('DAILY') || 
    m.includes('AGRALE') ||
    d.includes('CAMINHÃO') || 
    d.includes('ÔNIBUS') || 
    d.includes('M BENZ') || 
    d.includes('SINALIZADOR ACUSTICO E VISUAL')
  ) {
    return 'PESADOS';
  }

  // 3. LEVES: Marcas e modelos de carros de passeio/viaturas leves comuns
  if (
    b === 'VW' || 
    b === 'FIAT' || 
    b === 'TOYOTA' || 
    b === 'GM' || 
    b === 'FORD' || 
    b === 'RENAULT' || 
    b === 'CHEVROLET' || 
    b === 'PEUGEOT' || 
    b === 'CITROEN' || 
    b === 'HYUNDAI' || 
    b === 'NISSAN' || 
    b === 'MITSUBISHI' ||
    m.includes('GOL') || 
    m.includes('VOYAGE') || 
    m.includes('UNO') || 
    m.includes('COROLLA') || 
    m.includes('HILUX') || 
    m.includes('PALIO') || 
    m.includes('SIENA') || 
    m.includes('ETIOS') || 
    m.includes('SPIN') || 
    m.includes('SANDERO') || 
    m.includes('LOGAN') || 
    m.includes('DUSTER') || 
    m.includes('KA ') || 
    m.includes('FIESTA') || 
    m.includes('FOCUS') ||
    m.includes('L200') ||
    m.includes('AMAROK') ||
    m.includes('RANGER') ||
    m.includes('S10')
  ) {
    return 'LEVES';
  }

  // 4. GERAL: Produtos de limpeza, pesos de balanceamento, itens genéricos
  return 'GERAL';
}

export function formatCurrency(value: number): string {
  const val = Number(value);
  if (isNaN(val) || value === undefined || value === null) {
    return 'R$ 0,00';
  }
  return val.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

/**
 * Normaliza strings para busca sem acentos e case-insensitive
 */
export function normalizeString(str: string): string {
  return String(str || '')
    .toUpperCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim();
}
