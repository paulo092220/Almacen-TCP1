
import { GoogleGenAI } from "@google/genai";
import { AppState, ConsignmentStatus, TransactionType } from "../types";

export const analyzeBusinessData = async (
  data: AppState, 
  query: string,
  userApiKey?: string
): Promise<string> => {
  // 1. Resolve API Key: User Input > Env Var (Standard) > Vite Env Var
  const apiKey = userApiKey || process.env.API_KEY || (import.meta as any).env?.VITE_API_KEY;

  // 2. Check Internet Connection
  if (!navigator.onLine) {
    return "⚠️ **Sin conexión a internet**\n\nEl Asistente Inteligente funciona con la nube de Google y requiere internet activo.\n\nPor favor, conecta tu equipo a internet para realizar consultas. El resto del sistema (Ventas, Inventario) sigue funcionando offline.";
  }

  // 3. Check API Key Availability
  if (!apiKey) {
    return "⚠️ **Falta configuración de API Key**\n\nPara usar el asistente, necesitas una API Key de Gemini.\n\n**Opciones de Configuración:**\n1. Ingresa la clave en la pestaña **Configuración > Inteligencia Artificial**.\n2. O agrega `VITE_API_KEY=tu_clave` en un archivo `.env` en la carpeta del proyecto.\n\n(Consigue tu clave gratis en aistudio.google.com)";
  }

  try {
    const ai = new GoogleGenAI({ apiKey: apiKey });
    
    // --- Pre-process Data for Better AI Context ---
    
    // Inventory Metrics
    const totalProducts = data.products.length;
    const totalStock = data.products.reduce((acc, p) => acc + p.stock, 0);
    const inventoryValue = data.products.reduce((acc, p) => acc + (p.stock * p.basePrice), 0);
    const lowStockProducts = data.products
      .filter(p => p.stock < 5)
      .map(p => `${p.name} (${p.stock})`)
      .join(", ");

    // Sales Metrics (Last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const recentSales = data.transactions.filter(t => 
      t.type === TransactionType.SALE && new Date(t.date) >= thirtyDaysAgo
    );
    const totalSales30Days = recentSales.reduce((acc, t) => acc + t.total, 0);

    // Top Selling Products Calculation
    const productSalesMap: Record<string, number> = {};
    recentSales.forEach(t => {
      productSalesMap[t.productId] = (productSalesMap[t.productId] || 0) + t.quantity;
    });
    const topProducts = Object.entries(productSalesMap)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)
      .map(([id, qty]) => {
        const p = data.products.find(prod => prod.id === id);
        return p ? `${p.name} (${qty} un.)` : null;
      })
      .filter(Boolean)
      .join(", ");

    // Debt Metrics
    const pendingConsignments = data.consignments.filter(c => c.status === ConsignmentStatus.PENDING);
    const totalDebt = pendingConsignments.reduce((acc, c) => acc + (c.totalExpected - (c.paidAmount || 0)), 0);
    
    // Customers with highest debt
    const customerDebtMap: Record<string, number> = {};
    pendingConsignments.forEach(c => {
      const debt = c.totalExpected - (c.paidAmount || 0);
      customerDebtMap[c.customerName] = (customerDebtMap[c.customerName] || 0) + debt;
    });
    const topDebtors = Object.entries(customerDebtMap)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)
      .map(([name, debt]) => `${name} ($${debt.toFixed(0)})`)
      .join(", ");

    // Context Construction
    const context = `
      Actúa como un experto analista de negocios y consultor financiero para un comercio minorista ("The Brothers").
      
      **Resumen del Negocio (Tiempo Real):**
      - **Inventario:** ${totalProducts} productos únicos. Stock total: ${totalStock} unidades. Valor total venta: $${inventoryValue.toFixed(2)}.
      - **Productos Bajos en Stock (Alerta):** ${lowStockProducts || "Ninguno"}.
      - **Ventas (Últimos 30 días):** Total $${totalSales30Days.toFixed(2)}.
      - **Productos Más Vendidos:** ${topProducts || "No hay datos recientes"}.
      - **Cuentas por Cobrar (Deuda en calle):** Total pendiente $${totalDebt.toFixed(2)}.
      - **Mayores Deudores:** ${topDebtors || "Ninguno"}.

      **Consulta del Usuario:** "${query}"

      **Instrucciones:**
      1. Responde de forma directa, breve y estratégica.
      2. Usa los datos numéricos provistos para respaldar tus consejos.
      3. Si preguntan qué reponer, menciona los productos bajos en stock o los más vendidos.
      4. Si preguntan por finanzas, enfócate en el flujo de caja vs deuda.
      5. Sé motivador pero realista.
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: context,
    });

    return response.text || "La IA analizó los datos pero no generó una respuesta textual.";
  } catch (error) {
    console.error("Error calling Gemini:", error);
    return "❌ **Error de Conexión con IA**\n\nHubo un problema al comunicarse con los servidores de Google. Verifica tu conexión a internet o tu API Key.";
  }
};