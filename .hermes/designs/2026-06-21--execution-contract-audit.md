# Execution Contract Audit 设计

## 背景

测试组发现 P1：`.hyperframes/expanded-prompt.md` 的 Execution Manifest 声明了多个武器，但 `index.html` 实际全是裸写 GSAP。现有 `quality_audit` 已经能检查带 `params` 的武器是否调用 canonical function，但无参数武器声明会漏检。

通俗说：报关单写了“用了厨房标准菜谱”，货柜里实际是厨师自由发挥。现在审计只查了“有配料表的菜”，没查“只报菜名没写配料的菜”。

## 架构归属

不新增孤立 audit。新增能力归入现有 Production Quality Layer：

- `Guardrail Hydrator`：管人，分发规则。
- `Arsenal Registry`：管物，记录武器资产台账。
- `quality_audit`：管账实一致，统一输出 P0/P1/P2/P3 issue。

Execution Contract Audit 是 `quality_audit` 里的 cross-file contract check。

## 检查规则

1. Manifest 声明 builtin weapon，且不是 HANDWRITE / reference_only。
2. 该 weapon 有 canonical function。
3. HTML 里必须出现该 canonical function call。
4. 即使 Manifest 没有 `params`，也必须检查是否调用。
5. HANDWRITE 明确声明时允许裸写。
6. `binding: reference_only` 或 `mode: reference_only` 只作为视觉参考，不强制调用，但报告 P3 记录。

## 输出口径

新增 issue code：

- `manifest_weapon_not_called`
  - severity: `P0`
  - category: `execution_contract`
  - message: 明确说明 Manifest weapon 有 canonical function，但 HTML 未调用。

复用现有 code，避免制造第二套语义。现有带 params 的逻辑继续负责参数漂移；新逻辑负责“有没有调用”这个基础契约。

## 测试策略

TDD：

1. RED：Manifest 声明无 params 的 `card-cascade-reveal`，HTML 只有裸写 GSAP，期望 `manifest_weapon_not_called`。
2. RED/GREEN：Manifest 声明 `HANDWRITE`，HTML 裸写 GSAP，不报 `manifest_weapon_not_called`。
3. RED/GREEN：Manifest 声明 `binding: reference_only`，HTML 裸写 GSAP，不报 P0，保留 P3 记录。
4. 回归：现有 `weapon_parameter_drift` 测试不变。

## 非目标

- 不替代 HyperFrames lint/validate/inspect。
- 不解析全部 JS AST；先用 canonical function call 的静态正则检查，和现有 quality_audit 保持同级复杂度。
- 不把 `reference_only` 当武器执行义务。
