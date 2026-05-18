import { Router, type IRouter, Request, Response } from "express";

const router: IRouter = Router();

// In-memory cache simple implementation (24h TTL)
const cache = new Map<string, { data: any, expiresAt: number }>();

router.get("/:cnpj", async (req: Request, res: Response) => {
  try {
    const cnpj = req.params.cnpj.replace(/\D/g, "");
    if (cnpj.length !== 14) {
      return res.status(400).json({ error: "CNPJ inválido", code: "VALIDATION_ERROR" });
    }

    // Check cache
    const cached = cache.get(cnpj);
    if (cached && cached.expiresAt > Date.now()) {
      return res.json(cached.data);
    }

    // Fetch from BrasilAPI
    const response = await fetch(`https://brasilapi.com.br/api/cnpj/v1/${cnpj}`);
    if (!response.ok) {
      if (response.status === 404) {
        return res.status(404).json({ error: "CNPJ não encontrado na Receita Federal", code: "NOT_FOUND" });
      }
      return res.status(response.status).json({ error: "Erro ao consultar CNPJ", code: "EXTERNAL_API_ERROR" });
    }

    const data = await response.json();

    // Map fields
    const mappedData = {
      razao_social: data.razao_social,
      nome_fantasia: data.nome_fantasia,
      email: data.email,
      telefone: data.ddd_telefone_1,
      endereco: `${data.logradouro}${data.numero ? ', ' + data.numero : ''}`,
      cidade: data.municipio,
      estado: data.uf,
      cep: data.cep,
      situacao_receita: data.descricao_situacao_cadastral,
    };

    // Save to cache (24h)
    cache.set(cnpj, { data: mappedData, expiresAt: Date.now() + 24 * 60 * 60 * 1000 });

    res.json(mappedData);
  } catch (error) {
    res.status(500).json({ error: "Erro interno ao consultar CNPJ", code: "INTERNAL" });
  }
});

export default router;
