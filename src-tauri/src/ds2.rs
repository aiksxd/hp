from typing import Any, List, Tuple, Optional, Union, Dict, Callable
from dataclasses import dataclass
from enum import Enum
import re

# ==================== 基础类型定义 ====================
class RustType(Enum):
    """Rust类型枚举"""
    I32 = "i32"
    I64 = "i64"
    F32 = "f32"
    F64 = "f64"
    BOOL = "bool"
    STR = "&str"
    STRING = "String"
    VEC = "Vec"
    OPTION = "Option"
    RESULT = "Result"
    UNIT = "()"

@dataclass
class Token:
    """词法分析Token"""
    type: str  # 类型：keyword, identifier, literal, operator, punctuation
    value: str
    line: int
    column: int

@dataclass
class FunctionSignature:
    """函数签名"""
    name: str
    params: List[Tuple[str, str]]  # [(参数名, 类型), ...]
    return_type: str
    is_async: bool = False

@dataclass
class FunctionCall:
    """函数调用表示"""
    name: str
    args: List[Any]
    line: int

# ==================== Rust语法解析器 ====================
class RustParser:
    """Rust语法解析器"""
    
    # Rust关键字
    KEYWORDS = {
        'fn', 'let', 'mut', 'const', 'pub', 'if', 'else', 'match', 
        'while', 'for', 'in', 'loop', 'break', 'continue', 'return',
        'struct', 'enum', 'impl', 'trait', 'use', 'mod', 'crate',
        'self', 'Self', 'super', 'as', 'async', 'await', 'move',
        'true', 'false', 'None', 'Some', 'Ok', 'Err', 'Box',
        'Result', 'Option', 'Vec', 'String', 'i32', 'i64', 'f32', 'f64',
        'bool', 'char', 'str', 'usize', 'isize'
    }
    
    # 操作符
    OPERATORS = {
        '+', '-', '*', '/', '%', '=', '==', '!=', '<', '>', '<=', '>=',
        '&&', '||', '!', '&', '|', '^', '<<', '>>', '+=', '-=', '*=',
        '/=', '%=', '&=', '|=', '^=', '<<=', '>>=', '=>', '->', '::'
    }
    
    def __init__(self):
        self.tokens: List[Token] = []
        self.current_line = 1
        self.current_column = 1
    
    def tokenize(self, code: str) -> List[Token]:
        """词法分析：将代码字符串转换为Token列表"""
        self.tokens = []
        self.current_line = 1
        self.current_column = 1
        
        i = 0
        code_length = len(code)
        
        while i < code_length:
            char = code[i]
            
            # 跳过空白字符
            if char in ' \t':
                self.current_column += 1
                i += 1
                continue
            
            # 换行符
            if char == '\n':
                self.current_line += 1
                self.current_column = 1
                i += 1
                continue
            
            # 单行注释
            if char == '/' and i + 1 < code_length and code[i + 1] == '/':
                while i < code_length and code[i] != '\n':
                    i += 1
                continue
            
            # 多行注释（简化版）
            if char == '/' and i + 1 < code_length and code[i + 1] == '*':
                i += 2
                while i + 1 < code_length and not (code[i] == '*' and code[i + 1] == '/'):
                    if code[i] == '\n':
                        self.current_line += 1
                        self.current_column = 1
                    i += 1
                i += 2
                continue
            
            # 字符串字面量
            if char == '"':
                start = i
                i += 1
                while i < code_length and code[i] != '"':
                    if code[i] == '\\' and i + 1 < code_length:
                        i += 1  # 跳过转义字符
                    i += 1
                if i < code_length:
                    i += 1
                value = code[start:i]
                self.tokens.append(Token('literal', value, self.current_line, self.current_column))
                self.current_column += len(value)
                continue
            
            # 字符字面量
            if char == "'":
                start = i
                i += 1
                while i < code_length and code[i] != "'":
                    if code[i] == '\\' and i + 1 < code_length:
                        i += 1
                    i += 1
                if i < code_length:
                    i += 1
                value = code[start:i]
                self.tokens.append(Token('literal', value, self.current_line, self.current_column))
                self.current_column += len(value)
                continue
            
            # 数字字面量
            if char.isdigit():
                start = i
                while i < code_length and (code[i].isdigit() or code[i] == '.' or code[i] in 'eE+-'):
                    i += 1
                # 检查类型后缀
                while i < code_length and code[i].isalpha():
                    i += 1
                value = code[start:i]
                self.tokens.append(Token('literal', value, self.current_line, self.current_column))
                self.current_column += len(value)
                continue
            
            # 标识符或关键字
            if char.isalpha() or char == '_':
                start = i
                while i < code_length and (code[i].isalnum() or code[i] == '_'):
                    i += 1
                value = code[start:i]
                token_type = 'keyword' if value in self.KEYWORDS else 'identifier'
                self.tokens.append(Token(token_type, value, self.current_line, self.current_column))
                self.current_column += len(value)
                continue
            
            # 操作符
            operator = None
            for op_len in range(3, 0, -1):  # 最长3个字符的操作符
                if i + op_len <= code_length and code[i:i+op_len] in self.OPERATORS:
                    operator = code[i:i+op_len]
                    self.tokens.append(Token('operator', operator, self.current_line, self.current_column))
                    i += op_len
                    self.current_column += op_len
                    break
            
            if operator:
                continue
            
            # 标点符号
            if char in '()[]{};:,.':
                self.tokens.append(Token('punctuation', char, self.current_line, self.current_column))
                self.current_column += 1
                i += 1
                continue
            
            # 未知字符
            i += 1
            self.current_column += 1
        
        return self.tokens
    
    def parse_function_signature(self, tokens: List[Token], start: int) -> Tuple[Optional[FunctionSignature], int]:
        """解析函数签名"""
        i = start
        
        # 检查是否为函数定义
        if i >= len(tokens) or tokens[i].value != 'fn':
            return None, start
        
        i += 1  # 跳过 'fn'
        
        # 解析函数名
        if i >= len(tokens) or tokens[i].type != 'identifier':
            return None, start
        
        func_name = tokens[i].value
        i += 1
        
        # 跳过泛型参数（简化版）
        if i < len(tokens) and tokens[i].value == '<':
            while i < len(tokens) and tokens[i].value != '>':
                i += 1
            if i < len(tokens) and tokens[i].value == '>':
                i += 1
        
        # 解析参数列表
        if i >= len(tokens) or tokens[i].value != '(':
            return None, start
        
        i += 1  # 跳过 '('
        params = []
        
        while i < len(tokens) and tokens[i].value != ')':
            # 参数名
            if tokens[i].type != 'identifier':
                return None, start
            
            param_name = tokens[i].value
            i += 1
            
            # 参数类型（冒号）
            if i >= len(tokens) or tokens[i].value != ':':
                return None, start
            
            i += 1  # 跳过 ':'
            
            # 类型
            type_tokens = []
            while i < len(tokens) and tokens[i].value not in ',)':
                type_tokens.append(tokens[i].value)
                i += 1
            
            param_type = ''.join(type_tokens)
            params.append((param_name, param_type))
            
            # 跳过逗号
            if i < len(tokens) and tokens[i].value == ',':
                i += 1
        
        if i >= len(tokens) or tokens[i].value != ')':
            return None, start
        
        i += 1  # 跳过 ')'
        
        # 返回值类型
        return_type = "()"  # 默认unit类型
        
        if i < len(tokens) and tokens[i].value == '->':
            i += 1  # 跳过 '->'
            return_type_tokens = []
            while i < len(tokens) and tokens[i].value not in ';{':
                return_type_tokens.append(tokens[i].value)
                i += 1
            return_type = ''.join(return_type_tokens).strip()
        
        # 检查是否为async函数
        is_async = func_name.startswith('async_')
        
        return FunctionSignature(func_name, params, return_type, is_async), i
    
    def parse_function_call(self, tokens: List[Token], start: int) -> Tuple[Optional[FunctionCall], int]:
        """解析函数调用"""
        i = start
        
        # 检查是否为函数调用
        if i >= len(tokens) or tokens[i].type != 'identifier':
            return None, start
        
        func_name = tokens[i].value
        i += 1
        
        # 检查是否有泛型参数（简化版）
        if i < len(tokens) and tokens[i].value == '::':
            i += 1
            if i < len(tokens) and tokens[i].value == '<':
                while i < len(tokens) and tokens[i].value != '>':
                    i += 1
                if i < len(tokens) and tokens[i].value == '>':
                    i += 1
        
        # 检查参数列表
        if i >= len(tokens) or tokens[i].value != '(':
            return None, start
        
        i += 1  # 跳过 '('
        args = []
        line = tokens[start].line
        
        while i < len(tokens) and tokens[i].value != ')':
            # 解析参数表达式（简化版）
            arg_tokens = []
            while i < len(tokens) and tokens[i].value not in ',)':
                arg_tokens.append(tokens[i])
                i += 1
            
            if arg_tokens:
                # 将token转换回字符串值
                arg_value = ''.join(t.value for t in arg_tokens)
                args.append(self._parse_literal(arg_value))
            
            # 跳过逗号
            if i < len(tokens) and tokens[i].value == ',':
                i += 1
        
        if i >= len(tokens) or tokens[i].value != ')':
            return None, start
        
        i += 1  # 跳过 ')'
        
        return FunctionCall(func_name, args, line), i
    
    def _parse_literal(self, value: str) -> Any:
        """解析字面量值"""
        value = value.strip()
        
        # 字符串字面量
        if value.startswith('"') and value.endswith('"'):
            return value[1:-1]
        
        # 字符字面量
        if value.startswith("'") and value.endswith("'"):
            return value[1:-1]
        
        # 布尔值
        if value == 'true':
            return True
        if value == 'false':
            return False
        
        # 整数
        if value.isdigit() or (value[0] == '-' and value[1:].isdigit()):
            # 检查类型后缀
            if value.endswith('i32'):
                return int(value[:-3])
            if value.endswith('i64'):
                return int(value[:-3])
            if value.endswith('u32'):
                return int(value[:-3])
            if value.endswith('u64'):
                return int(value[:-3])
            return int(value)
        
        # 浮点数
        try:
            return float(value)
        except ValueError:
            pass
        
        # 其他（返回原始字符串）
        return value

# ==================== 预制函数库 ====================
class RustFunctionLibrary:
    """预制Rust风格函数库"""
    
    def __init__(self):
        self.functions: Dict[str, Callable] = {}
        self._register_functions()
    
    def _register_functions(self):
        """注册所有预制函数"""
        # 数学函数
        self.functions['add'] = lambda x, y: x + y
        self.functions['subtract'] = lambda x, y: x - y
        self.functions['multiply'] = lambda x, y: x * y
        self.functions['divide'] = lambda x, y: x / y if y != 0 else float('inf')
        self.functions['pow'] = lambda x, y: x ** y
        
        # 字符串函数
        self.functions['to_uppercase'] = lambda s: s.upper()
        self.functions['to_lowercase'] = lambda s: s.lower()
        self.functions['trim'] = lambda s: s.strip()
        self.functions['len'] = lambda s: len(s)
        self.functions['concat'] = lambda s1, s2: s1 + s2
        
        # 向量/列表函数
        self.functions['vec_new'] = lambda: []
        self.functions['vec_push'] = lambda vec, item: vec.append(item) or vec
        self.functions['vec_pop'] = lambda vec: vec.pop() if vec else None
        self.functions['vec_len'] = lambda vec: len(vec)
        self.functions['vec_get'] = lambda vec, index: vec[index] if 0 <= index < len(vec) else None
        
        # 逻辑函数
        self.functions['and'] = lambda x, y: x and y
        self.functions['or'] = lambda x, y: x or y
        self.functions['not'] = lambda x: not x
        self.functions['eq'] = lambda x, y: x == y
        self.functions['neq'] = lambda x, y: x != y
        self.functions['gt'] = lambda x, y: x > y
        self.functions['lt'] = lambda x, y: x < y
        
        # Option和Result相关函数
        self.functions['Some'] = lambda x: ('Some', x)
        self.functions['None'] = lambda: ('None', None)
        self.functions['Ok'] = lambda x: ('Ok', x)
        self.functions['Err'] = lambda x: ('Err', x)
        self.functions['unwrap'] = lambda opt: opt[1] if opt[0] == 'Some' else None
        self.functions['unwrap_or'] = lambda opt, default: opt[1] if opt[0] == 'Some' else default
        
        # 打印函数
        self.functions['println'] = lambda *args: print(*args)
        self.functions['print'] = lambda *args: print(*args, end='')
    
    def execute_function(self, func_name: str, args: List[Any]) -> Any:
        """执行预制函数"""
        if func_name not in self.functions:
            raise ValueError(f"未定义的函数: {func_name}")
        
        func = self.functions[func_name]
        
        # 检查参数数量
        import inspect
        sig = inspect.signature(func)
        params = list(sig.parameters.values())
        
        if len(args) != len(params):
            raise ValueError(f"函数 {func_name} 期望 {len(params)} 个参数，但提供了 {len(args)} 个")
        
        # 执行函数
        return func(*args)
    
    def get_available_functions(self) -> List[str]:
        """获取所有可用函数名"""
        return list(self.functions.keys())

# ==================== Rust语法模拟器主类 ====================
class RustSimulator:
    """Rust语法模拟器"""
    
    def __init__(self):
        self.parser = RustParser()
        self.function_lib = RustFunctionLibrary()
        self.variables: Dict[str, Any] = {}
    
    def parse_and_execute(self, code: str) -> List[Dict[str, Any]]:
        """
        解析并执行Rust风格代码
        
        返回:
            List[Dict]: 每行执行的结果
        """
        results = []
        lines = code.strip().split('\n')
        
        for line_num, line in enumerate(lines, 1):
            line = line.strip()
            if not line or line.startswith('//'):
                continue
            
            try:
                # 词法分析
                tokens = self.parser.tokenize(line)
                if not tokens:
                    continue
                
                # 解析函数调用
                i = 0
                while i < len(tokens):
                    # 尝试解析变量声明
                    if tokens[i].value == 'let':
                        result = self._parse_variable_declaration(tokens, i)
                        if result:
                            var_name, var_value, i = result
                            self.variables[var_name] = var_value
                            results.append({
                                'line': line_num,
                                'type': 'variable_declaration',
                                'name': var_name,
                                'value': var_value,
                                'success': True
                            })
                            continue
                    
                    # 解析函数调用
                    func_call, new_i = self.parser.parse_function_call(tokens, i)
                    if func_call:
                        # 执行函数调用
                        result = self._execute_function_call(func_call)
                        results.append({
                            'line': line_num,
                            'type': 'function_call',
                            'function': func_call.name,
                            'args': func_call.args,
                            'result': result,
                            'success': True
                        })
                        i = new_i
                    else:
                        # 无法解析，跳过
                        i += 1
                
            except Exception as e:
                results.append({
                    'line': line_num,
                    'type': 'error',
                    'error': str(e),
                    'success': False
                })
        
        return results
    
    def _parse_variable_declaration(self, tokens: List[Token], start: int) -> Optional[Tuple[str, Any, int]]:
        """解析变量声明"""
        i = start
        
        if i >= len(tokens) or tokens[i].value != 'let':
            return None
        
        i += 1  # 跳过 'let'
        
        # 检查是否可变
        is_mut = False
        if i < len(tokens) and tokens[i].value == 'mut':
            is_mut = True
            i += 1
        
        # 变量名
        if i >= len(tokens) or tokens[i].type != 'identifier':
            return None
        
        var_name = tokens[i].value
        i += 1
        
        # 类型注解（可选）
        if i < len(tokens) and tokens[i].value == ':':
            i += 1
            # 跳过类型
            while i < len(tokens) and tokens[i].value != '=':
                i += 1
        
        # 赋值
        if i >= len(tokens) or tokens[i].value != '=':
            return None
        
        i += 1  # 跳过 '='
        
        # 解析值
        value_tokens = []
        while i < len(tokens) and tokens[i].value != ';':
            value_tokens.append(tokens[i])
            i += 1
        
        if not value_tokens:
            return None
        
        # 将token转换回字符串
        value_str = ''.join(t.value for t in value_tokens)
        
        # 尝试解析为字面量
        value = self.parser._parse_literal(value_str)
        
        # 跳过分号
        if i < len(tokens) and tokens[i].value == ';':
            i += 1
        
        return var_name, value, i
    
    def _execute_function_call(self, func_call: FunctionCall) -> Any:
        """执行函数调用"""
        # 替换变量引用
        resolved_args = []
        for arg in func_call.args:
            if isinstance(arg, str) and arg in self.variables:
                resolved_args.append(self.variables[arg])
            else:
                resolved_args.append(arg)
        
        # 执行函数
        return self.function_lib.execute_function(func_call.name, resolved_args)
    
    def interactive_mode(self):
        """交互式模式"""
        print("=== Rust语法模拟器 ===")
        print("可用的预制函数:", ', '.join(self.function_lib.get_available_functions()))
        print("输入 'exit' 退出")
        print("输入 'vars' 查看所有变量")
        print("-" * 50)
        
        while True:
            try:
                user_input = input("rust> ").strip()
                
                if user_input.lower() == 'exit':
                    break
                elif user_input.lower() == 'vars':
                    print("变量:")
                    for name, value in self.variables.items():
                        print(f"  {name}: {value}")
                    continue
                elif not user_input:
                    continue
                
                results = self.parse_and_execute(user_input)
                
                for result in results:
                    if result['type'] == 'error':
                        print(f"错误: {result['error']}")
                    elif result['type'] == 'function_call':
                        print(f"结果: {result['result']}")
                    elif result['type'] == 'variable_declaration':
                        print(f"声明变量 {result['name']} = {result['value']}")
                
            except KeyboardInterrupt:
                print("\n再见!")
                break
            except Exception as e:
                print(f"错误: {e}")

# ==================== 示例和使用 ====================
def main():
    """主函数"""
    simulator = RustSimulator()
    
    # 示例代码
    example_code = """
    // Rust风格代码示例
    let x = 10;
    let y = 20;
    
    let sum = add(x, y);
    println("x + y = ", sum);
    
    let message = "Hello, Rust!";
    let upper = to_uppercase(message);
    println(upper);
    
    let numbers = vec_new();
    vec_push(numbers, 1);
    vec_push(numbers, 2);
    vec_push(numbers, 3);
    
    println("Vector length: ", vec_len(numbers));
    
    let is_greater = gt(x, 5);
    println("Is x > 5? ", is_greater);
    
    let option_val = Some(42);
    let unwrapped = unwrap(option_val);
    println("Unwrapped value: ", unwrapped);
    """
    
    print("=== 执行示例代码 ===")
    results = simulator.parse_and_execute(example_code)
    
    print("\n执行结果:")
    for result in results:
        if result['type'] == 'function_call':
            print(f"行 {result['line']}: {result['function']}{result['args']} = {result['result']}")
        elif result['type'] == 'variable_declaration':
            print(f"行 {result['line']}: let {result['name']} = {result['value']}")
        elif result['type'] == 'error':
            print(f"行 {result['line']}: 错误 - {result['error']}")
    
    print("\n" + "="*50)
    
    # 交互式模式
    simulator.interactive_mode()

# 快速使用函数
def rust_execute(code: str) -> List[Any]:
    """
    快速执行Rust风格代码
    
    参数:
        code: Rust风格代码字符串
    
    返回:
        每行执行结果的列表
    """
    simulator = RustSimulator()
    results = simulator.parse_and_execute(code)
    
    # 只返回函数调用的结果
    return [r['result'] for r in results if r['type'] == 'function_call' and r['success']]

if __name__ == "__main__":
    main()