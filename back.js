async function converterMoeda() {
  const valor = document.getElementById('valor').value;
  const deMoeda = document.getElementById('de').value;
  const paraMoeda = document.getElementById('para').value;
  const resultadoElemento = document.getElementById('resultado');

  if (!valor || isNaN(valor)) {
      resultadoElemento.value = "Por favor, insira um valor válido.";
      return;
  }

  try {
      const response = await fetch(`https://economia.awesomeapi.com.br/last/${deMoeda}-${paraMoeda}`);
      const data = await response.json();
      console.log("Resposta da API (converterMoeda):", data);

      if (data && data[`${deMoeda}${paraMoeda}`]) {
          const cotacao = data[`${deMoeda}${paraMoeda}`].bid;
          const valorConvertido = (parseFloat(valor) * parseFloat(cotacao)).toFixed(2);
          resultadoElemento.value = `${valorConvertido} ${paraMoeda}`;
      } else {
          resultadoElemento.value = "Erro ao obter a cotação.";
          pararAtualizacaoGrafico();
      }
  } catch (error) {
      console.error("Erro na requisição (converterMoeda):", error);
      resultadoElemento.value = "Ocorreu um erro ao converter a moeda.";
      pararAtualizacaoGrafico();
  }
}

async function buscarHistoricoMoedaRealTime(moedaBase, moedaContra, dias = 5) {
  try {
      const url = `https://economia.awesomeapi.com.br/json/daily/${moedaBase}-${moedaContra}/${dias}`;
      const response = await fetch(url);
      const data = await response.json();
      console.log("Resposta da API (buscarHistoricoMoedaRealTime):", data);

      // Ordenar os dados por data
      const dadosOrdenados = [...data].sort(
          (a, b) => new Date(a.timestamp) - new Date(b.timestamp)
      );

      const datas = dadosOrdenados.map((item) =>
          moment(item.timestamp * 1000).format("DD-MM-YYYY")
      );
      const cotacoes = dadosOrdenados.map((item) => parseFloat(item.bid));

      return { datas, cotacoes };
  } catch (error) {
      console.error("Erro ao buscar dados históricos:", error);
      return { datas: [], cotacoes: [] };
  }
}

let currencyChart;
let currentBaseCurrency = document.getElementById("de").value;
let currentQuoteCurrency = document.getElementById("para").value;
let updateInterval;

async function atualizarGrafico(
  baseMoeda,
  quoteMoeda,
  initialData = { datas: [], cotacoes: [] }
) {
  const ctx = document.getElementById("currencyChart").getContext("2d");
  console.log("Dados para atualizarGrafico:", initialData);

  const reversedData = {
      datas: [...initialData.datas].reverse(),
      cotacoes: [...initialData.cotacoes].reverse(),
  };

  if (currencyChart) {
      currencyChart.data.labels = reversedData.datas;
      currencyChart.data.datasets[0].data = reversedData.cotacoes;
      currencyChart.options.title.text = `Cotação Diária (${baseMoeda} para ${quoteMoeda})`;
      currencyChart.update();
  } else {
      currencyChart = new Chart(ctx, {
          type: "line",
          data: {
              labels: reversedData.datas,
              datasets: [
                  {
                      label: `Cotação Diária (${baseMoeda } para ${quoteMoeda})`,
                      data: reversedData.cotacoes,
                      borderColor: "#00a053",
                      borderWidth: 2,
                      fill: true,
                  },
              ],
          },
          options: {
              responsive: true,
              maintainAspectRatio: false,
              scales: {
                  y: {
                      beginAtZero: false,
                      title: {
                          display: true,
                          text: "Cotação",
                      },
                  },
                  x: {
                      title: {
                          display: true,
                          text: "Data",
                      },
                      ticks: {
                          source: "labels",
                          autoSkip: true,
                          maxRotation: 0,
                          sampleSize: 7,
                      },
                  },
              },
              plugins: {
                  legend: {
                      display: false,
                  },
              },
              title: {
                  display: true,
                  text: `Cotação Diária (${baseMoeda} para ${quoteMoeda})`,
              },
          },
      });
  }

  currentBaseCurrency = baseMoeda;
  currentQuoteCurrency = quoteMoeda;
}

function iniciarAtualizacaoGrafico(baseMoeda, quoteMoeda) {
  const intervalo = 60000;

  async function atualizar() {
      const dias = document.getElementById("historicoDias").value;
      const novosDados = await buscarHistoricoMoedaRealTime(baseMoeda, quoteMoeda, dias);
      if (currencyChart) {
          atualizarGrafico(baseMoeda, quoteMoeda, novosDados);
      } else {
          atualizarGrafico(baseMoeda, quoteMoeda, novosDados);
      }
  }

  atualizar();
  updateInterval = setInterval(atualizar, intervalo);
}

function pararAtualizacaoGrafico() {
  if (updateInterval) {
      clearInterval(updateInterval);
      updateInterval = null;
  }
}

window.onload = async () => {
  const initialBase = document.getElementById("de").value;
  const initialQuote = document.getElementById("para").value;
  const initialDays = document.getElementById("historicoDias").value;
  const initialData = await buscarHistoricoMoedaRealTime(
      initialBase,
      initialQuote,
      initialDays
  );
  atualizarGrafico(initialBase, initialQuote, initialData);
  iniciarAtualizacaoGrafico(initialBase, initialQuote);
};

document.getElementById("de").addEventListener("change", () => {
  const novaBase = document.getElementById("de").value;
  const novaQuote = document.getElementById("para").value;
  currentBaseCurrency = novaBase;
  currentQuoteCurrency = novaQuote;
  pararAtualizacaoGrafico();
  iniciarAtualizacaoGrafico(novaBase , novaQuote);
});

document.getElementById("para").addEventListener("change", () => {
  const novaBase = document.getElementById("de").value;
  const novaQuote = document.getElementById("para").value;
  currentBaseCurrency = novaBase;
  currentQuoteCurrency = novaQuote;
  pararAtualizacaoGrafico();
  iniciarAtualizacaoGrafico(novaBase, novaQuote);
});

document.getElementById("changeConversion").addEventListener("click", () => {
  const selectDe = document.getElementById("de");
  const selectPara = document.getElementById("para");

  const moedaDeAnterior = selectDe.value;
  const moedaParaAnterior = selectPara.value;

  console.log("changeConversion - moedaDeAnterior:", moedaDeAnterior, "moedaParaAnterior:", moedaParaAnterior); // ADICIONADO

  // Inverte os valores dos dropdowns
  selectDe.value = moedaParaAnterior;
  selectPara.value = moedaDeAnterior;

  console.log("changeConversion - novo DE:", selectDe.value, "novo PARA:", selectPara.value); // ADICIONADO

  pararAtualizacaoGrafico();
  iniciarAtualizacaoGrafico(selectDe.value, selectPara.value);
});

document.getElementById("historicoDias").addEventListener("change", async () => {
  const novaBase = document.getElementById("de").value;
  const novaQuote = document.getElementById("para").value;
  pararAtualizacaoGrafico();
  const novosDados = await buscarHistoricoMoedaRealTime(
      novaBase,
      novaQuote,
      this.value
  );
  atualizarGrafico(novaBase, novaQuote, novosDados);
  iniciarAtualizacaoGrafico(novaBase, novaQuote);
});