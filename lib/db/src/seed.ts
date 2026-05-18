import { fornecedoresTable, materiaisTable, occsTable, occItensTable, occTimelineTable, templatesTable, precoHistoricoTable } from "./schema/index.js";
import { db } from "./index.js";
import { sql } from "drizzle-orm";
import pg from "pg";
import dotenv from "dotenv";

dotenv.config();

async function seed() {
  console.log("Seeding database...");
  
  // Limpar tabelas (ordem reversa de dependência)
  console.log("Limpando tabelas...");
  await db.delete(precoHistoricoTable);
  await db.delete(occTimelineTable);
  await db.delete(occItensTable);
  await db.delete(occsTable);
  await db.delete(templatesTable);
  await db.delete(materiaisTable);
  await db.delete(fornecedoresTable);

  // Fornecedores
  console.log("Inserindo fornecedores...");
  const fornecedores = await db.insert(fornecedoresTable).values([
    { razaoSocial: "Fornecedor Alpha Ltda", nomeFantasia: "Alpha", cnpj: "12.345.678/0001-90", email: "contato@alpha.com.br", telefone: "(11) 98765-4321", cidade: "São Paulo", estado: "SP" },
    { razaoSocial: "Beta Componentes S.A.", nomeFantasia: "Beta Comp", cnpj: "98.765.432/0001-10", email: "vendas@beta.com.br", telefone: "(21) 99887-6655", cidade: "Rio de Janeiro", estado: "RJ" },
    { razaoSocial: "Gama Industrial", nomeFantasia: "Gama", cnpj: "11.222.333/0001-44", email: "vendas@gama.ind.br", telefone: "(31) 3333-4444", cidade: "Belo Horizonte", estado: "MG" },
    { razaoSocial: "Delta Distribuidora (Inativo)", nomeFantasia: "Delta", cnpj: "44.555.666/0001-77", email: "contato@delta.com", ativo: false },
    { razaoSocial: "Epsilon Ferramentas", cnpj: "77.888.999/0001-00", email: "comercial@epsilon.com.br" },
  ]).returning();

  const [fAlpha, fBeta, fGama] = fornecedores;

  // Materiais
  console.log("Inserindo materiais...");
  const materiais = await db.insert(materiaisTable).values([
    { nome: "Parafuso Sextavado M8", codigo: "PAR-M8", categoria: "Fixadores", unidade: "cx", estoqueAtual: "10", estoqueMinimo: "5", precoReferencia: "45.50" },
    { nome: "Porca M8", codigo: "POR-M8", categoria: "Fixadores", unidade: "cx", estoqueAtual: "8", estoqueMinimo: "5", precoReferencia: "25.00" },
    { nome: "Cabo Flexível 2.5mm", codigo: "CAB-2.5", categoria: "Elétrico", unidade: "rl", estoqueAtual: "2", estoqueMinimo: "5", precoReferencia: "180.00" }, // Abaixo do mínimo
    { nome: "Disjuntor Bipolar 20A", codigo: "DIS-20A", categoria: "Elétrico", unidade: "un", estoqueAtual: "15", estoqueMinimo: "10", precoReferencia: "35.90" },
    { nome: "Tubo PVC 25mm", codigo: "TUB-25", categoria: "Hidráulico", unidade: "br", estoqueAtual: "50", estoqueMinimo: "20", precoReferencia: "12.50" },
    { nome: "Luva PVC 25mm", codigo: "LUV-25", categoria: "Hidráulico", unidade: "un", estoqueAtual: "100", estoqueMinimo: "30", precoReferencia: "2.10" },
    { nome: "Chave de Fenda", codigo: "FER-001", categoria: "Ferramentas", unidade: "un", estoqueAtual: "1", estoqueMinimo: "2", precoReferencia: "18.50" }, // Abaixo do mínimo
    { nome: "Chave Philips", codigo: "FER-002", categoria: "Ferramentas", unidade: "un", estoqueAtual: "3", estoqueMinimo: "2", precoReferencia: "19.00" },
    { nome: "Capacete de Segurança", codigo: "EPI-001", categoria: "EPI", unidade: "un", estoqueAtual: "20", estoqueMinimo: "10", precoReferencia: "45.00" },
    { nome: "Luva de Raspa", codigo: "EPI-002", categoria: "EPI", unidade: "pr", estoqueAtual: "5", estoqueMinimo: "15", precoReferencia: "15.50" }, // Abaixo do mínimo
  ]).returning();

  const [mat1, mat2, mat3, mat4] = materiais;

  // Templates
  console.log("Inserindo templates...");
  await db.insert(templatesTable).values([
    { nome: "Kit Instalação Elétrica Básico", descricao: "Material padrão para instalação de quadro", tipo: "Recorrente", fornecedorId: fBeta.id, favorito: true, itens: [{ materialId: mat3.id, quantidade: 2, unidade: "rl" }, { materialId: mat4.id, quantidade: 1, unidade: "un" }] },
    { nome: "Reposição de Fixadores", tipo: "Padrão", fornecedorId: fAlpha.id, itens: [{ materialId: mat1.id, quantidade: 10, unidade: "cx" }, { materialId: mat2.id, quantidade: 10, unidade: "cx" }] }
  ]);

  // OCCs
  console.log("Inserindo OCCs...");
  const ano = new Date().getFullYear();
  
  // OCC 1: Rascunho
  const [occ1] = await db.insert(occsTable).values({
    numero: `OCC-${ano}-00001`, fornecedorId: fAlpha.id, status: "Rascunho", prioridade: "Normal", totalValor: "70.50"
  }).returning();
  await db.insert(occItensTable).values([
    { occId: occ1.id, materialId: mat1.id, quantidade: "1", precoUnitario: "45.50", unidade: "cx", subtotal: "45.50" },
    { occId: occ1.id, materialId: mat2.id, quantidade: "1", precoUnitario: "25.00", unidade: "cx", subtotal: "25.00" }
  ]);
  await db.insert(occTimelineTable).values({ occId: occ1.id, statusNovo: "Rascunho", comentario: "Criada pelo usuário", usuario: "Admin" });

  // OCC 2: Em Negociação
  const [occ2] = await db.insert(occsTable).values({
    numero: `OCC-${ano}-00002`, fornecedorId: fBeta.id, status: "Em Negociação", prioridade: "Alta"
  }).returning();
  await db.insert(occItensTable).values([
    { occId: occ2.id, materialId: mat3.id, quantidade: "5", precoUnitario: "0", unidade: "rl", subtotal: "0" }
  ]);
  await db.insert(occTimelineTable).values([
    { occId: occ2.id, statusNovo: "Rascunho", usuario: "Sistema" },
    { occId: occ2.id, statusAnterior: "Rascunho", statusNovo: "Enviada", usuario: "Comprador" },
    { occId: occ2.id, statusAnterior: "Enviada", statusNovo: "Em Negociação", comentario: "Aguardando desconto no cabo", usuario: "Comprador" }
  ]);

  // OCC 3: Finalizada (com histórico de preço)
  const dataEntrega = new Date(); dataEntrega.setDate(dataEntrega.getDate() + 5);
  const dataEntregaStr = dataEntrega.toISOString().split("T")[0];
  const [occ3] = await db.insert(occsTable).values({
    numero: `OCC-${ano}-00003`, fornecedorId: fGama.id, status: "Finalizada", prioridade: "Urgente", dataEntrega: dataEntregaStr, totalValor: "185.00"
  }).returning();
  await db.insert(occItensTable).values([
    { occId: occ3.id, materialId: mat4.id, quantidade: "5", precoUnitario: "37.00", unidade: "un", subtotal: "185.00" }
  ]);
  await db.insert(occTimelineTable).values([
    { occId: occ3.id, statusNovo: "Rascunho", usuario: "Sistema" },
    { occId: occ3.id, statusAnterior: "Rascunho", statusNovo: "Enviada", usuario: "Sistema" },
    { occId: occ3.id, statusAnterior: "Enviada", statusNovo: "Respondida", usuario: "Fornecedor" },
    { occId: occ3.id, statusAnterior: "Respondida", statusNovo: "Aprovada", usuario: "Gerente" },
    { occId: occ3.id, statusAnterior: "Aprovada", statusNovo: "Comprada", usuario: "Sistema" },
    { occId: occ3.id, statusAnterior: "Comprada", statusNovo: "Recebida", usuario: "Almoxarifado" },
    { occId: occ3.id, statusAnterior: "Recebida", statusNovo: "Finalizada", usuario: "Financeiro" }
  ]);
  await db.insert(precoHistoricoTable).values([
    { materialId: mat4.id, fornecedorId: fGama.id, occId: occ3.id, preco: "37.00", quantidade: "5", variacao: "5.5" }
  ]);

  console.log("Seeding concluído com sucesso!");
}

seed().catch(console.error).finally(() => process.exit(0));
