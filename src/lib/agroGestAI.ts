import {
  ProductionRecord,
  CostRecord,
  InventoryItem,
  SaleRecord,
} from '../types';

interface AgroDataSummary {
  productions: ProductionRecord[];
  costs: CostRecord[];
  inventory: InventoryItem[];
  sales: SaleRecord[];
}

export function answerAgroQuery(
  question: string,
  data: AgroDataSummary
): { answer: string; metrics?: Record<string, any> } {
  const q = question.toLowerCase().trim();

  // Check if user has no data at all
  const hasAnyData =
    data.sales.length > 0 ||
    data.costs.length > 0 ||
    data.productions.length > 0 ||
    data.inventory.length > 0;

  if (!hasAnyData) {
    return {
      answer: 'Ainda não existem dados suficientes cadastrados para realizar essa análise.',
    };
  }

  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth(); // 0-indexed

  // Format currency
  const formatBRL = (val: number) =>
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);

  // 1. "Quanto vendi este mês?" / "Vendas deste mês"
  if (
    q.includes('vendi este mês') ||
    q.includes('vendas este mês') ||
    q.includes('faturamento deste mês') ||
    q.includes('vendas do mês')
  ) {
    const salesThisMonth = data.sales.filter((s) => {
      const d = new Date(s.date + 'T00:00:00');
      return d.getFullYear() === currentYear && d.getMonth() === currentMonth;
    });

    if (salesThisMonth.length === 0) {
      return {
        answer: 'Nenhuma venda foi registrada no mês atual até o momento.',
      };
    }

    const total = salesThisMonth.reduce((acc, s) => acc + s.totalAmount, 0);
    const count = salesThisMonth.length;
    return {
      answer: `Neste mês você realizou ${count} ${
        count === 1 ? 'venda' : 'vendas'
      }, totalizando **${formatBRL(total)}** em faturamento.`,
    };
  }

  // 1.1 "Quanto vendi no total?" / "Faturamento total"
  if (
    q.includes('vendi no total') ||
    q.includes('faturamento total') ||
    q.includes('vendas totais') ||
    q.includes('total vendido') ||
    q.includes('quanto vendi no ano')
  ) {
    if (data.sales.length === 0) {
      return {
        answer: 'Ainda não existem vendas registradas no sistema.',
      };
    }
    const total = data.sales.reduce((acc, s) => acc + s.totalAmount, 0);
    return {
      answer: `Seu faturamento total acumulado é de **${formatBRL(total)}** em ${data.sales.length} vendas registradas.`,
    };
  }

  // 2. "Quanto gastei este mês?" / "Custos deste mês" / "Despesas deste mês"
  if (
    q.includes('gastei este mês') ||
    q.includes('custos este mês') ||
    q.includes('despesas este mês') ||
    q.includes('gastos do mês')
  ) {
    const costsThisMonth = data.costs.filter((c) => {
      const d = new Date(c.date + 'T00:00:00');
      return d.getFullYear() === currentYear && d.getMonth() === currentMonth;
    });

    if (costsThisMonth.length === 0) {
      return {
        answer: 'Nenhum custo foi registrado no mês atual até o momento.',
      };
    }

    const total = costsThisMonth.reduce((acc, c) => acc + c.amount, 0);
    const count = costsThisMonth.length;
    return {
      answer: `Seus custos registrados neste mês somam **${formatBRL(total)}** (${count} ${
        count === 1 ? 'despesa' : 'despesas'
      }).`,
    };
  }

  // 2.1 "Quanto gastei no total?" / "Custos totais"
  if (
    q.includes('gastei no total') ||
    q.includes('custos totais') ||
    q.includes('despesas totais') ||
    q.includes('total de gastos')
  ) {
    if (data.costs.length === 0) {
      return {
        answer: 'Ainda não existem custos registrados no sistema.',
      };
    }
    const total = data.costs.reduce((acc, c) => acc + c.amount, 0);
    return {
      answer: `Seus custos totais acumulados somam **${formatBRL(total)}** em ${data.costs.length} lançamentos.`,
    };
  }

  // 3. "Qual foi meu maior custo?" / "Maior despesa"
  if (q.includes('maior custo') || q.includes('maior gasto') || q.includes('maior despesa')) {
    if (data.costs.length === 0) {
      return {
        answer: 'Ainda não existem dados de custos cadastrados para realizar essa análise.',
      };
    }

    const sortedCosts = [...data.costs].sort((a, b) => b.amount - a.amount);
    const topCost = sortedCosts[0];
    return {
      answer: `Seu maior custo registrado foi **${topCost.description}** no valor de **${formatBRL(
        topCost.amount
      )}** (Categoria: ${topCost.category.replace('_', ' ')}, data: ${topCost.date}).`,
    };
  }

  // 4. "Quanto produzi nos últimos 3 meses?" / "Produção recente"
  if (
    q.includes('últimos 3 meses') ||
    q.includes('ultimos 3 meses') ||
    q.includes('quanto produzi') ||
    q.includes('produção recente')
  ) {
    if (data.productions.length === 0) {
      return {
        answer: 'Ainda não existem dados de produção cadastrados para realizar essa análise.',
      };
    }

    const threeMonthsAgo = new Date();
    threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);

    const recentProd = data.productions.filter((p) => {
      const d = new Date(p.date + 'T00:00:00');
      return d >= threeMonthsAgo;
    });

    if (recentProd.length === 0) {
      return {
        answer: 'Não há registros de produção nos últimos 3 meses.',
      };
    }

    // Group by product and unit
    const byProduct: Record<string, { qty: number; unit: string }> = {};
    recentProd.forEach((p) => {
      const key = `${p.product} (${p.unit})`;
      if (!byProduct[key]) byProduct[key] = { qty: 0, unit: p.unit };
      byProduct[key].qty += p.quantity;
    });

    const lines = Object.entries(byProduct).map(
      ([prod, val]) => `• ${prod}: ${val.qty} ${val.unit}`
    );

    return {
      answer: `Nos últimos 3 meses você produziu:\n${lines.join('\n')}`,
    };
  }

  // 5. "Qual produto teve maior resultado?" / "Produto mais rentável" / "Mais vendido"
  if (
    q.includes('maior resultado') ||
    q.includes('mais rentável') ||
    q.includes('mais vendido') ||
    q.includes('melhor produto')
  ) {
    if (data.sales.length === 0) {
      return {
        answer: 'Ainda não existem vendas cadastradas para avaliar o produto com maior resultado.',
      };
    }

    const productSales: Record<string, { total: number; qty: number; unit: string }> = {};
    data.sales.forEach((s) => {
      if (!productSales[s.product]) {
        productSales[s.product] = { total: 0, qty: 0, unit: s.unit };
      }
      productSales[s.product].total += s.totalAmount;
      productSales[s.product].qty += s.quantity;
    });

    const sorted = Object.entries(productSales).sort((a, b) => b[1].total - a[1].total);
    const top = sorted[0];

    return {
      answer: `O produto com maior faturamento foi **${top[0]}**, gerando **${formatBRL(
        top[1].total
      )}** com ${top[1].qty} ${top[1].unit} comercializados.`,
    };
  }

  // 6. "Quais itens estão com estoque baixo?" / "Estoque crítico" / "Estoque baixo"
  if (
    q.includes('estoque baixo') ||
    q.includes('estoque crítico') ||
    q.includes('alerta de estoque') ||
    q.includes('falta no estoque')
  ) {
    if (data.inventory.length === 0) {
      return {
        answer: 'Ainda não existem itens de estoque cadastrados.',
      };
    }

    const lowStock = data.inventory.filter((i) => i.currentQuantity <= i.minQuantity);
    if (lowStock.length === 0) {
      return {
        answer: 'Todos os itens de estoque estão em quantidade adequada (acima do estoque mínimo).',
      };
    }

    const items = lowStock.map(
      (i) => `• **${i.item}**: atual ${i.currentQuantity} ${i.unit} (mínimo: ${i.minQuantity} ${i.unit})`
    );
    return {
      answer: `Há ${lowStock.length} ${
        lowStock.length === 1 ? 'item com estoque baixo' : 'itens com estoque baixo'
      }:\n${items.join('\n')}`,
    };
  }

  // 7. "Como estão meus custos?" / "Categorias de custos" / "Resumo financeiro"
  if (
    q.includes('como estão meus custos') ||
    q.includes('resumo de custos') ||
    q.includes('onde mais gastei') ||
    q.includes('custos por categoria')
  ) {
    if (data.costs.length === 0) {
      return {
        answer: 'Ainda não existem custos registrados para análise.',
      };
    }

    const totalCost = data.costs.reduce((acc, c) => acc + c.amount, 0);
    const catMap: Record<string, number> = {};
    data.costs.forEach((c) => {
      catMap[c.category] = (catMap[c.category] || 0) + c.amount;
    });

    const sortedCats = Object.entries(catMap).sort((a, b) => b[1] - a[1]);
    const topCat = sortedCats[0];

    const categoryNames: Record<string, string> = {
      insumos: 'Insumos',
      alimentacao: 'Alimentação',
      mao_de_obra: 'Mão de Obra',
      transporte: 'Transporte',
      energia: 'Energia',
      manutencao: 'Manutenção',
      equipamentos: 'Equipamentos',
      outros: 'Outros',
    };

    const details = sortedCats
      .slice(0, 3)
      .map(
        ([c, val]) =>
          `• ${categoryNames[c] || c}: ${formatBRL(val)} (${Math.round(
            (val / totalCost) * 100
          )}%)`
      )
      .join('\n');

    return {
      answer: `Seus custos acumulados somam **${formatBRL(totalCost)}**. A principal categoria de despesa é **${
        categoryNames[topCat[0]] || topCat[0]
      }** (${formatBRL(topCat[1])}).\n\nPrincipais despesas:\n${details}`,
    };
  }

  // 8. General Financial health / Resultado geral
  if (q.includes('lucro') || q.includes('resultado') || q.includes('balanço') || q.includes('quanto ganhei')) {
    const totalRev = data.sales.reduce((acc, s) => acc + s.totalAmount, 0);
    const totalCost = data.costs.reduce((acc, c) => acc + c.amount, 0);
    const net = totalRev - totalCost;
    const margin = totalRev > 0 ? (net / totalRev) * 100 : 0;

    return {
      answer: `Seu resultado total acumulado é de **${formatBRL(net)}** (Receita: ${formatBRL(
        totalRev
      )}, Custos: ${formatBRL(totalCost)}), com margem estimada de **${margin.toFixed(1)}%**.`,
    };
  }

  // Fallback default response
  return {
    answer:
      'Ainda não existem dados suficientes ou essa pergunta não pôde ser calculada com precisão. Você pode perguntar sobre: faturamento do mês, custos do mês, maior despesa, itens com estoque baixo ou produção recente.',
  };
}
