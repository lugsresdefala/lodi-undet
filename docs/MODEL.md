# Documentação técnica do modelo farmacocinético

**Motor:** `src/lib/pk.ts` · versão do modelo: ver `MODEL_VERSION` exportado  
**Formulação modelada:** Undecilato de testosterona 1000 mg IM em óleo de rícino (Nebido® / Reandron® 1000 mg / 4 mL)

---

## 1. Fundamento farmacocinético

### 1.1 Modo flip-flop

O undecilato de testosterona IM em óleo de rícino é uma **formulação de depósito lipofílico**. Após injecção intramuscular, o éster dissolve-se lentamente a partir da fase oleosa para os tecidos e corrente sanguínea. Isto significa que:

1. A **etapa limitante de velocidade** é a libertação do fármaco a partir do depot, e não a eliminação sistémica.
2. O **tempo de semi-vida aparente** observado no terminal (~33 d) reflecte a taxa de libertação do depot, e não a semi-vida biológica intrínseca da testosterona (t½ real da T livre ≈ 10–100 min).
3. O modelo exibe cinética "flip-flop": `ka > ke` nas constantes de ajuste monofásico, ao contrário do que seria esperado num modelo convencional de absorção/eliminação.

**Referência:** Behre HM, Nieschlag E. _Eur J Endocrinol_ 1999;140(5):414–9.

### 1.2 Modelo Bateman de um compartimento (forma clearance)

```
C(t) = (F · D_T · ka · ke) / (Cl · (ka − ke)) · (e^(−ke·t) − e^(−ka·t))
```

Expressar em termos de clearance (em vez de Vd aparente) é numericamente mais estável em cinética flip-flop, onde o Vd calculado perde significado físico.

**Parâmetros:**

| Símbolo | Definição                                     | Valor padrão        | Fonte                        |
| ------- | --------------------------------------------- | ------------------- | ---------------------------- |
| `D_T`   | dose efectiva de T = dose_TU × 0,6315         | 631,5 mg (1000 mg TU) | Razão MW: 288,43 / 456,71  |
| `ka`    | constante de absorção = ln 2 / t½_abs         | 0,1733 d⁻¹ (t½ = 4 d) | Compromisso ENIGI/Schubert |
| `ke`    | constante terminal aparente = ln 2 / t½_elim  | 0,0210 d⁻¹ (t½ = 33 d) | Schubert 2004;89:5429–34  |
| `F`     | biodisponibilidade                            | 1,0 (IM directo)    | —                            |
| `Cl`    | clearance metabólica efectiva = Cl_kg × peso  | 17,5 × peso L/dia   | ENIGI/Defreyne 2018          |

**Caso degenerado (ka ≈ ke):**

Quando `|ka − ke| < 10⁻⁶`, o modelo usa o limite analítico:
```
C(t) = base · k² · t · e^(−k·t)   com k = (ka + ke) / 2
```

### 1.3 Superposição linear (doses múltiplas)

Para um esquema de N doses com tempos `{t₀, t₁, ..., t_{N−1}}`:

```
C_total(t) = Σᵢ C_single(t − tᵢ)   para t > tᵢ
```

Isto pressupõe **linearidade** (sem saturação enzimática ou de receptor), válida para concentrações terapêuticas de testosterona em adultos.

---

## 2. Parâmetros e calibração

### 2.1 Constante de absorção (ka) e o compromisso Tmax

O Tmax analítico para dose única é:

```
Tmax = ln(ka / ke) / (ka − ke)
```

Com t½_abs = 4 d → ka = 0,1733 d⁻¹ e ke = 0,0210 d⁻¹:

```
Tmax = ln(0,1733 / 0,0210) / (0,1733 − 0,0210) ≈ 14 dias
```

Schubert 2004 reporta Tmax mediano ≈ 7 dias, o que implicaria t½_abs ≈ 1,5 d. No entanto, com este valor a Cmax por dose única excede 900 ng/dL, acima da Cmax em estado estacionário observada na coorte ENIGI (~810–920 ng/dL). O valor **t½_abs = 4 d é um compromisso calibrado** para reproduzir simultaneamente Cmax e Cmédia da coorte ENIGI, à custa de um Tmax ligeiramente mais tardio do que o mediano de Schubert 2004.

### 2.2 Clearance metabólica e calibração populacional

Wang et al. (2004) mediram a MCR da testosterona por diluição isotópica em homens cis eugonadais: **~21 L/kg/dia** (mediana). Em homens trans em TU IM (coorte ENIGI; Defreyne 2018; Pelusi 2014), o retro-cálculo a partir das concentrações observadas (Cmédia em manutenção ~600–700 ng/dL) aponta para **~17–18 L/kg/dia**. Este modelo usa **17,5 L/kg/dia** como valor padrão.

Possíveis explicações para a diferença:
- Supressão parcial da produção endógena de testosterona (reduz a "dilução metabólica")
- Diferenças de composição corporal (menor massa muscular média na coorte de início de hormonização)
- Efeitos de exposição prévia a estrogénio exógeno no metabolismo hepático (CYP450)

### 2.3 Esquema de loading (dose de ataque)

Segundo a Endocrine Society 2017 (Hembree et al., _JCEM_ 2017) e o SmPC do Nebido, o esquema padrão prevê:

- **Dose 1:** t = 0
- **Dose 2:** t = 42 dias (6 semanas) — dose de ataque
- **Doses seguintes:** t = 42 + n × τ (fase de manutenção)

O propósito da dose de ataque é acelerar a chegada ao estado estacionário, que demora 4–5 × t½ aparente (~132–165 dias) sem loading.

---

## 3. Simulação Monte Carlo (variação populacional)

### 3.1 Fundamento

A variabilidade inter-individual na clearance (CV ~30–50%) e nos parâmetros de libertação do depot (ka, ke; CV ~20–35%) é elevada e bem documentada:

- Schubert 2004: CV do AUC ~47%
- Behre & Nieschlag 1999: elevada variação no Tmax e Cmax entre sujeitos
- Zitzmann & Nieschlag 2007: CV da testosterona total em resposta ao TU IM ~35–50%

O modelo simula esta variação gerando coortes virtuais onde cada parâmetro é amostrado de uma distribuição log-normal com o mesmo CV do utilizador.

### 3.2 Implementação

**Distribuição log-normal:** Para um parâmetro θ com mediana θ₀ e CV:

```
θᵢ ~ LogNormal(μ = ln θ₀,  σ = √ln(1 + CV²))
```

**Factor de escala 0,7 para ka e ke:** A clearance sistémica (determinada por enzimas hepáticas e composição corporal) exibe maior variabilidade inter-individual do que os parâmetros de libertação do depot (determinados predominantemente por vascularização do local de injecção). Este rácio é uma escolha de modelação na ausência de dados de variância conjunta publicados para TU IM.

**PRNG determinístico:** O gerador mulberry32 com seed configurável garante reprodutibilidade idêntica entre renders. Seed padrão: 1234.

**Independência entre parâmetros:** Os três parâmetros (Cl, ka, ke) são amostrados independentemente. A correlação real entre eles é desconhecida; este é um pressuposto conservador.

### 3.3 Percentis calculados

Por defeito:
- **P5–P95**: faixa onde caem 90% dos sujeitos simulados
- **P50**: mediana populacional

Opcionalmente: **P25–P75** (intervalo interquartil, 50% central).

---

## 4. Métricas clínicas

### 4.1 Cmax, Ctrough, Cmean

Calculadas no **último intervalo posológico** da simulação (proxy de estado estacionário):

```
Cmax    = max{ C(t) : t ∈ [t_última_dose, t_última_dose + τ] }
Ctrough = min{ C(t) : t ∈ [t_última_dose, t_última_dose + τ] }
Cmean   = AUC[τ] / τ   (integração trapezoidal, Rowland & Tozer 5ª ed.)
```

Regra trapezoidal composta:
```
AUC ≈ Σᵢ (h/2) · (C_i + C_{i+1})   com h = 1 dia (resolução da série)
```

### 4.2 Intervalo de referência

264–916 ng/dL (percentis 2,5–97,5 em 4 coortes combinadas EUA/UE em homens de 19–39 anos):  
Travison TG et al. _JCEM_ 2017;102(4):1161–73.

### 4.3 Intervalo sugerido a partir de Cmédia-alvo

```
τ_sugerido = F · D_T / (Cl · C_alvo) × 10⁵
```

Baseado na equação de estado estacionário: `Css_avg = F · D_T / (Cl · τ) × 10⁵`

**Faixa individual plausível de 90%** (pressupondo log-normal para Cl com σ = √ln(1 + CV²)):
```
[τ × exp(−1,645 σ),  τ × exp(+1,645 σ)]
```

---

## 5. Titulação individual

### 5.1 Princípio

Uma única medição sérica em estado estacionário, com dia pós-dose conhecido, permite calibrar a curva modelo ao indivíduo via um **factor de escala**:

```
factor = C_medido / C_modelo(t_colheita)
Cmean_indiv = Cmean_população × factor
τ_indiv = τ_actual × Cmean_indiv / C_alvo
```

A Cl individual estimada:
```
Cl_indiv = Cl_pop / factor
```

### 5.2 Condições para validade

| Condição                      | Critério                              | Verificação automática |
| ----------------------------- | ------------------------------------- | ---------------------- |
| Estado estacionário           | ≥ 4 × t½ (≈ 132 d) no mesmo esquema  | ✅ erro se não cumprido |
| Timing de colheita documentado | Dia pós-dose rigorosamente conhecido  | ✅ aviso se ≤ 3 d       |
| Colheita em vale               | Dia ≈ τ − 1                          | ✅ aviso se near-trough |
| Factor individual plausível    | 0,5 < factor < 2,0                   | ✅ aviso se extremo     |

Se estas condições não forem cumpridas, o factor individual é enviusado e o intervalo estimado não é clinicamente fiável.

### 5.3 Caveats

- O factor de escala absorve variabilidade de **todas** as fontes: Cl, ka, ke, dose administrada real, volume de injecção, local.
- A estimativa de τ_indiv é válida para o mesmo regime de dose; qualquer alteração de dose requer nova calibração.
- A titulação não substitui a avaliação clínica: sintomas, hematócrito, pressão arterial, e PSA devem ser considerados.

---

## 6. Limitações conhecidas

1. **Modelo de um compartimento:** ignora a distribuição tecidual bifásica observável nas primeiras horas após injecção IM profunda.
2. **Linearidade pressuposta:** sem saturação da SHBG, dependência de concentração na clearance, nem efeitos de inibição da produção endógena.
3. **Parâmetros de depot fixos (ka, ke):** na realidade variam com o local de injecção, volume, temperatura corporal e profundidade da agulha.
4. **Calibração de Cl para homens trans (ENIGI):** pode não ser generalizável a outras populações (etnicidade, índice de massa muscular, medicação concomitante).
5. **Produção endógena não modelada:** pressupõe supressão total. Em fases precoces ou com produção residual, a concentração real pode ser superior ao modelo.
6. **Variabilidade do local de injecção:** fibrose por injecções repetidas, técnica e ângulo de injecção não são modelados.
7. **Correlação entre parâmetros:** assume independência entre Cl, ka e ke; a estrutura de correlação real é desconhecida.

---

## 7. Referências

| # | Referência completa                                                                                                                            | Relevância                                        |
| - | ---------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------- |
| 1 | Schubert M et al. _J Clin Endocrinol Metab_ 2004;89(11):5429–34. doi:10.1210/jc.2004-0935                                                    | PK primário TU 1000 mg IM: Tmax ≈ 7 d, t½ = 33,9 d |
| 2 | Behre HM, Nieschlag E. _Eur J Endocrinol_ 1999;140(5):414–9. doi:10.1530/eje.0.1400414                                                       | Primeira descrição cinética flip-flop TU IM       |
| 3 | Wang C et al. _J Clin Endocrinol Metab_ 2004;89(2):534–43. doi:10.1210/jc.2003-030330                                                        | MCR da testosterona por diluição isotópica        |
| 4 | Defreyne J et al. _Andrology_ 2018;6(3):441–51. doi:10.1111/andr.12480                                                                       | ENIGI; calibração Cl ≈ 17,5 L/kg/d em homens trans |
| 5 | Pelusi C et al. _Andrology_ 2014;2(4):516–21. doi:10.1111/j.2047-2927.2014.00211.x                                                          | Validação coorte italiana, homens trans           |
| 6 | Hembree WC et al. _J Clin Endocrinol Metab_ 2017;102(11):3869–903. doi:10.1210/jc.2017-01658                                                 | Endocrine Society CPG 2017                        |
| 7 | Travison TG et al. _J Clin Endocrinol Metab_ 2017;102(4):1161–73. doi:10.1210/jc.2016-2935                                                   | Intervalo de referência harmonizado 264–916 ng/dL |
| 8 | Coleman E et al. _J Sex Med_ 2022;19(3):S1–S259. doi:10.1016/j.jsxm.2022.01.003                                                              | WPATH Standards of Care v8                       |
| 9 | Zitzmann M, Nieschlag E. _Nat Clin Pract Urol_ 2007;4(3):160–70. doi:10.1038/ncpuro0753                                                      | Variabilidade inter-individual TU IM              |
| 10 | Rowland M, Tozer TN. _Clinical Pharmacokinetics and Pharmacodynamics: Concepts and Applications_. 5ª ed. Wolters Kluwer; 2011                | Fundamentos de PK; integração trapezoidal         |
| 11 | Saad F et al. _J Androl_ 2007;28(4):568–76. doi:10.2164/jandrol.106.001859                                                                   | Individualização de intervalos TU IM             |
| 12 | Zitzmann M et al. _J Urol_ 2013;190(1):234–40. doi:10.1016/j.juro.2013.01.051                                                                | Variabilidade clínica e ajuste de intervalos      |
