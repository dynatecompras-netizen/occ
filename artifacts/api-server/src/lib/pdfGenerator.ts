// Simple HTML-based PDF generator for OCC printing
export function generatePdfHtml(occ: any): string {
  const fmt = (v: number) => new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(v);
  const fmtDate = (d: string | Date | null) => {
    if (!d) return "-";
    return new Date(d).toLocaleDateString("pt-BR");
  };

  const itensRows = (occ.itens || []).map((item: any, idx: number) => {
    const subtotal = item.quantidade * item.precoUnitario;
    return `<tr style="background:${idx % 2 === 0 ? "#fff" : "#f8f9fa"}">
      <td style="border:1px solid #ddd;padding:6px 10px">${item.materialCodigo || "-"}</td>
      <td style="border:1px solid #ddd;padding:6px 10px">${item.materialNome || "-"}</td>
      <td style="border:1px solid #ddd;padding:6px 10px;text-align:center">${item.quantidade}</td>
      <td style="border:1px solid #ddd;padding:6px 10px;text-align:center">${item.unidade}</td>
      <td style="border:1px solid #ddd;padding:6px 10px;text-align:right">${fmt(item.precoUnitario)}</td>
      <td style="border:1px solid #ddd;padding:6px 10px;text-align:right;font-weight:bold">${fmt(subtotal)}</td>
    </tr>`;
  }).join("");

  const total = (occ.itens || []).reduce((s: number, i: any) => s + i.quantidade * i.precoUnitario, 0);
  const f = occ.fornecedor;

  return `<!DOCTYPE html><html lang="pt-BR"><head><meta charset="UTF-8">
<title>OCC ${occ.numero}</title>
<style>
  body{font-family:Arial,sans-serif;margin:40px;color:#333;font-size:13px}
  h1{font-size:22px;margin:0} h2{font-size:16px;margin:0}
  .header{display:flex;justify-content:space-between;border-bottom:3px solid #1e293b;padding-bottom:16px;margin-bottom:24px}
  .info-grid{display:grid;grid-template-columns:1fr 1fr;gap:16px;margin-bottom:24px}
  .info-box{border:1px solid #ddd;padding:12px;border-radius:6px}
  .info-box h3{font-size:12px;text-transform:uppercase;color:#666;margin:0 0 8px;letter-spacing:0.5px}
  .info-box p{margin:3px 0;font-size:13px}
  table{width:100%;border-collapse:collapse;margin-bottom:20px}
  th{background:#1e293b;color:white;padding:8px 10px;text-align:left;font-size:12px}
  .signatures{display:grid;grid-template-columns:1fr 1fr 1fr;gap:40px;margin-top:60px}
  .sig{text-align:center;padding-top:8px;border-top:1px solid #333}
  .footer{margin-top:40px;text-align:center;font-size:10px;color:#999;border-top:1px solid #eee;padding-top:12px}
  @media print{body{margin:20px}}
</style></head><body>
<div class="header">
  <div><h1>MATERION</h1><p style="color:#666;font-size:11px">Sistema ERP de Compras</p></div>
  <div style="text-align:right">
    <h2>ORDEM DE COMPRA</h2>
    <p style="font-size:15px;font-weight:bold">${occ.numero}</p>
    <p style="font-size:11px;color:#666">Gerado em: ${fmtDate(new Date())}</p>
  </div>
</div>
<div class="info-grid">
  <div class="info-box">
    <h3>Dados da Ordem</h3>
    <p><strong>Número:</strong> ${occ.numero}</p>
    <p><strong>Status:</strong> ${occ.status}</p>
    <p><strong>Prioridade:</strong> ${occ.prioridade}</p>
    <p><strong>Criação:</strong> ${fmtDate(occ.criadoEm)}</p>
    <p><strong>Entrega Prevista:</strong> ${fmtDate(occ.dataEntrega)}</p>
  </div>
  <div class="info-box">
    <h3>Fornecedor</h3>
    <p><strong>${f?.razaoSocial || "-"}</strong></p>
    <p>CNPJ: ${f?.cnpj || "-"}</p>
    <p>${[f?.endereco, f?.cidade, f?.estado].filter(Boolean).join(", ") || "-"}</p>
    <p>Tel: ${f?.telefone || "-"} | Email: ${f?.email || "-"}</p>
  </div>
</div>
<table>
  <thead><tr>
    <th>Código</th><th>Descrição</th><th style="text-align:center">Qtd</th>
    <th style="text-align:center">Un</th><th style="text-align:right">Preço Unit.</th>
    <th style="text-align:right">Subtotal</th>
  </tr></thead>
  <tbody>${itensRows}</tbody>
  <tfoot><tr>
    <td colspan="5" style="border:1px solid #ddd;padding:8px 10px;text-align:right;font-weight:bold;font-size:14px">TOTAL GERAL</td>
    <td style="border:1px solid #ddd;padding:8px 10px;text-align:right;font-weight:bold;font-size:14px">${fmt(total)}</td>
  </tr></tfoot>
</table>
${occ.observacoes ? `<div class="info-box"><h3>Observações</h3><p>${occ.observacoes}</p></div>` : ""}
<div class="signatures">
  <div class="sig"><p style="font-size:11px;color:#666">Comprador</p><p>Data: ___/___/______</p></div>
  <div class="sig"><p style="font-size:11px;color:#666">Aprovador</p><p>Data: ___/___/______</p></div>
  <div class="sig"><p style="font-size:11px;color:#666">Fornecedor</p><p>Data: ___/___/______</p></div>
</div>
<div class="footer">${occ.numero} | ${occ.status} | MATERION ERP © 2026</div>
<script>window.onload=()=>window.print()</script>
</body></html>`;
}
