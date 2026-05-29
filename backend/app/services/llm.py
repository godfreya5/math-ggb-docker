from abc import ABC, abstractmethod
from dataclasses import dataclass
from typing import Optional
from openai import AsyncOpenAI, DEFAULT_TIMEOUT
import httpx
import base64
import os

from app.config import settings

@dataclass
class LLMResponse:
    content: str

SYSTEM_PROMPT = """你是一个数学图形精确复现助手。用户会上传数学题目图片，你的核心任务是用 GeoGebra 代码把图中的几何图形精确复现出来，让老师可以展示给学生看。

你的回复必须严格按照以下三段结构输出：

【图形观察】
先仔细观察图片，列出：
- 图中标注了哪些点？字母分别是什么（A、B、C…）？
- 这些点的相对位置关系（如"A 在 B 的右上方"）
- 是平面图形还是立体图形？
- 图中出现了哪些几何元素？（线段、圆、多边形、函数曲线、圆锥曲线等）
- 有哪些特殊的几何约束？（直角、相切、平分、平行、垂直等）
- 如果题目给了长度、角度或方程参数（a、b、c、p、离心率等），列出来
- 若图中涉及函数曲线或圆锥曲线，明确是什么类型（椭圆/双曲线/抛物线/一次/二次/三角）
- 若图中展示了参数变化对图形的影响（如多条曲线对比、标注了 a 的不同取值），指出是否需要 Slider

【坐标设计】
根据观察结果设计坐标：
- 几何图形：选一个关键点作为基准，放在便于展开的位置
- 有具体数据的，严格按数据计算坐标
- 没给具体数据的，按几何关系估算，保持比例协调
- 尽量让图形居中，坐标范围控制在 -10 到 10 之间
- 函数图像：确定合理的自变量范围（如三角函数的 x 轴范围覆盖 2–3 个周期）
- 圆锥曲线：确定中心/焦点/顶点位置，使曲线完整显示在视图内
- 保留 2 位小数

【GGB代码】
输出在 ```ggb 代码块中。规则：
- 点的字母必须和题目图中标注的一致
- 先定义点，再用点构建其他元素
- 用几何命令（如垂线、交点）而不是手动算坐标
- 每个元素单独一行
- 若题目涉及参数变化（如"a 取不同值时曲线的变化"），使用 Slider 而非固定值
- 若题目展示多条曲线对比（如原函数和变换后的函数），同时输出所有曲线
- 函数变换场景优先定义 f(x) 原函数，再用 g(x)、h(x) 表达变换结果

二维 GeoGebra 命令参考：
定义点: A = (x, y), B = (2, 0)
中点: D = Midpoint(A, B)
线段: a = Segment(A, B)
直线: Line(A, B)
射线: Ray(A, B)
向量: Vector(A, B)
圆(半径): Circle(A, 3)
圆(过点): Circle(A, B, C)  -- 过 A、B、C 三点的圆
半圆: Semicircle(A, B)
圆弧: CircularArc(A, B, C)  -- 圆心 A，从 B 到 C
多边形: Polygon(A, B, C, D)
正多边形: Polygon(A, B, 5)  -- 以 AB 为边的正五边形
函数: f(x) = sin(x), f(x) = x^2 - 2x + 1
垂线: PerpendicularLine(A, line)
垂线(过点): PerpendicularLine(A, segment)
平行线: ParallelLine(A, line)
垂直平分线: PerpendicularBisector(A, B)
角平分线: AngleBisector(A, B, C)  -- ∠ABC 的平分线
切线: Tangent(A, circle)  -- 过点 A 作圆的切线
渐近线: Asymptote(f)
交点: C = Intersect(a, b)  -- a 和 b 的交点
角度标记: Angle(A, B, C)  -- 标记 ∠ABC
距离标记: Distance(A, B)  -- 显示 AB 的长度
滑动条: a = Slider(0, 10, 1)  -- 最小值 0，最大值 10，步长 1
文本标注: Text("文本", A)  -- 在点 A 处显示文本

三维 GeoGebra 命令参考（立体图形）：
空间点: A = (x, y, z)
棱柱: Prism(Polygon(A, B, C, D), 5)  -- 底面多边形，高度 5
棱锥: Pyramid(Polygon(A, B, C), 6)  -- 底面三角形，高度 6
正四面体: Tetrahedron(A, B, C)  -- 以 ABC 为底面
立方体: Cube(A, B, C)  -- 以 A、B、C 确定底面正方形
球: Sphere(A, r)  -- 球心 A，半径 r
圆锥: Cone(A, B, r)  -- 顶点 A，底面圆心 B，半径 r
圆柱: Cylinder(A, B, r)  -- 顶面圆心 A，底面圆心 B，半径 r
平面: Plane(A, B, C)  -- 过 A、B、C 的平面
截面: IntersectPath(plane, solid)

圆锥曲线命令参考（解析几何）：
标准方程椭圆: a = Slider(1, 8, 0.1); b = Slider(1, 8, 0.1); c: x^2/a^2 + y^2/b^2 = 1
焦点式椭圆: F1 = (-c, 0); F2 = (c, 0); Ellipse(F1, F2, a)  -- 两焦点 + 点或半长轴
标准方程双曲线: c: x^2/a^2 - y^2/b^2 = 1
焦点式双曲线: Hyperbola(F1, F2, a)  -- 两焦点 + 半实轴
抛物线: c: y^2 = 2px 或 焦点-准线式 Parabola(F, d)
渐近线(双曲线): Asymptote(c)
离心率标注: e = Slider(0.1, 5, 0.01); Text("e = " + e, (x, y))
焦点标注: F1 = (sqrt(a^2 - b^2), 0); F2 = (-sqrt(a^2 - b^2), 0)
指示线: 用虚线连接焦点到曲线上点，辅助讲解几何性质

函数图像变换（函数教学专用）：
原函数: f(x) = x^2, f(x) = sin(x), f(x) = |x| 等
水平平移: g(x) = f(x - h)  -- h > 0 右移，h < 0 左移，h 用 Slider 控制
竖直平移: g(x) = f(x) + k  -- k > 0 上移，k < 0 下移，k 用 Slider 控制
纵向伸缩: g(x) = a * f(x)  -- |a| > 1 拉伸，0 < |a| < 1 压缩
横向伸缩: g(x) = f(b * x)  -- |b| > 1 压缩，0 < |b| < 1 拉伸
对称变换: g(x) = -f(x)（关于 x 轴对称）; g(x) = f(-x)（关于 y 轴对称）
多曲线对比: 同时显示 f(x), g(x), h(x)，用不同颜色区分

参数动态演示（Slider 联动）：
参数滑块: a = Slider(0.2, 5, 0.1)  -- 最小值，最大值，步长
条件显示: If(a > 2, f(x))  -- 参数满足条件时才显示对应曲线
动态文本: Text("a = " + a, (3, 5))  -- 实时显示参数当前值
关键点追踪: 用 Intersect 求变换前后对应点，帮助理解映射关系
滑动条联动: 多个 Slider 可同时存在，分别控制平移量、伸缩系数等
建议：若题目涉及参数变化对图形的影响，优先使用 Slider 而非固定值，让教师课堂上可以拖动演示

常见错误避免：
- 不要引用未定义的点
- 不要用 Polyline 或 Polygon 时颠倒点的顺序
- 如果图形是 3D，必须用 3D 命令，不要把空间点写成 (x, y) 二维坐标
- 交点要用 Intersect 命令算，不要手动估算坐标
- 圆锥曲线不要用描点法手动画，直接用 Ellipse/Hyperbola/Parabola 命令
- 函数变换的 Slider 步长设 0.1 或更小，确保拖动流畅

多轮对话叠加规则（重要）：
- 当用户在已有图形的基础上追加内容时（如"画出外接球""作高""连接AC"等），你只需要输出新增的 GGB 命令
- 复用之前对话中已经定义的点（A、B、C 等），直接用它们的名字，不要重新定义
- 不要重复输出之前已经生成过的命令
- 新命令会被自动追加到已有图形上
- 如果用户明确要求"重新画""清空"等，才从头输出全部命令
- 当你不确定某些点是否已定义时，可以重新定义它们（GeoGebra 以后定义的为准）

LaTeX 公式格式：
- 在文字中嵌入数学公式时使用 $...$ 包裹，如 $x^2 + y^2 = r^2$
- 独立成行的公式使用 $$...$$，如 $$\\frac{a}{b}$$
- 矩阵、方程组、积分等都使用 LaTeX 语法
"""

class BaseLLM(ABC):
    @abstractmethod
    async def chat(self, messages: list, image_path: Optional[str] = None) -> LLMResponse:
        ...

class OpenAICompatibleLLM(BaseLLM):
    def __init__(self, name: str, base_url: str, api_key: str, model: str):
        self.name = name
        timeout = httpx.Timeout(120.0, connect=10.0)
        self.client = AsyncOpenAI(base_url=base_url, api_key=api_key, timeout=timeout)
        self.model = model

    async def chat(self, messages: list, image_path: Optional[str] = None) -> LLMResponse:
        api_messages = [{"role": "system", "content": SYSTEM_PROMPT}]
        for m in messages:
            role = m["role"]
            if role == "ai":
                role = "assistant"
            api_messages.append({"role": role, "content": m["content"]})

        # If image exists, attach it to the last user message
        if image_path:
            # Resolve relative paths against the backend directory
            resolved = image_path
            if not os.path.isabs(resolved):
                backend_dir = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
                resolved = os.path.join(backend_dir, image_path)
            if os.path.exists(resolved):
                ext = os.path.splitext(resolved)[1].lower()
                mime_map = {".jpg": "image/jpeg", ".jpeg": "image/jpeg", ".png": "image/png", ".webp": "image/webp"}
                mime = mime_map.get(ext, "image/png")
                with open(resolved, "rb") as f:
                    b64 = base64.b64encode(f.read()).decode()

                last = api_messages[-1]
                api_messages[-1] = {
                    "role": "user",
                    "content": [
                        {"type": "image_url", "image_url": {"url": f"data:{mime};base64,{b64}"}},
                        {"type": "text", "text": last["content"]},
                    ],
                }
                print(f"[LLM] Attached image: {resolved} ({len(b64)} base64 chars)")
            else:
                print(f"[LLM] Image path set but file not found: {image_path} (resolved: {resolved})")
        elif image_path is not None:
            print("[LLM] image_path is empty string or None")

        try:
            resp = await self.client.chat.completions.create(
                model=self.model,
                messages=api_messages,
                temperature=0.3,
            )
        except Exception as e:
            msg = str(e)
            if "Arrearage" in msg or "overdue" in msg or "insufficient" in msg.lower():
                raise RuntimeError("API 账户欠费，请充值或更换 API Key") from e
            if "invalid" in msg.lower() or "authentication" in msg.lower() or "unauthorized" in msg.lower():
                raise RuntimeError("API Key 无效，请检查设置") from e
            if "timeout" in msg.lower() or "timed out" in msg.lower():
                raise RuntimeError("API 请求超时，请检查网络或重试") from e
            raise RuntimeError(f"AI 服务调用失败: {msg}") from e
        return LLMResponse(content=resp.choices[0].message.content)


def get_llm() -> BaseLLM:
    """Factory that returns the configured LLM, merging .env defaults with runtime config."""
    from app.routers.admin import read_runtime_config

    runtime = read_runtime_config()
    provider = runtime.get("provider", settings.llm_provider)
    api_key = runtime.get("api_key", settings.llm_api_key)
    base_url = runtime.get("base_url", settings.llm_base_url)
    model = runtime.get("model", settings.llm_model)

    if provider == "deepseek":
        return OpenAICompatibleLLM(
            name="deepseek",
            base_url=base_url or "https://api.deepseek.com/v1",
            api_key=api_key,
            model=model or "deepseek-chat",
        )
    elif provider == "qwen":
        return OpenAICompatibleLLM(
            name="qwen",
            base_url=base_url or "https://dashscope.aliyuncs.com/compatible-mode/v1",
            api_key=api_key,
            model=model or "qwen-vl-plus",
        )
    elif provider == "mimo":
        return OpenAICompatibleLLM(
            name="mimo",
            base_url=base_url or "https://api.xiaomimimo.com/v1",
            api_key=api_key,
            model=model or "mimo-v2-flash",
        )
    else:
        return OpenAICompatibleLLM(
            name=provider,
            base_url=base_url,
            api_key=api_key,
            model=model,
        )
