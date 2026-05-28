from app.services.ggb import extract_ggb_commands

def test_extract_ggb_commands():
    text = """这道题的做法如下：

```ggb
A = (0, 0)
B = (3, 0)
C = (2, 3.46)
Polygon(A, B, C)
```
以上就是完整代码。"""
    cmds = extract_ggb_commands(text)
    assert cmds == ["A = (0, 0)", "B = (3, 0)", "C = (2, 3.46)", "Polygon(A, B, C)"]

def test_extract_no_ggb_block():
    cmds = extract_ggb_commands("这道题没有代码块")
    assert cmds is None

def test_extract_ggb_skips_comments():
    text = """```ggb
A = (0, 0)
// This is a comment
B = (3, 0)
```"""
    cmds = extract_ggb_commands(text)
    assert cmds == ["A = (0, 0)", "B = (3, 0)"]
