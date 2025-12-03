def python_exec(code, inputs=None):
    try:
        # print(inputs)
        indented_code = '\n'.join('    ' + line for line in code.split('\n'))
        wrapped = f"""def f(inputs):\n{indented_code}\nresult = f(_inputs)"""
        # print(wrapped)

        locals_dict = {'_inputs': inputs}
        exec(wrapped, locals_dict)
    
        return {
            "error": False,
            "labelMarkedForOutputs": 'rawResult',
            "result": locals_dict.get('result'),
        }
    except Exception as e:
        # print(e)
        return {
            "error": True,
            "labelMarkedForOutputs": 'rawResult',
            "details": str(e),
        }

# code = """
# x = inputs * 2
# y = x + 10
# return y
# """
# print(python_exec(code, 1))