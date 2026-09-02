import base64
import os

template_path = r'C:\Users\10032221614\Downloads\cmm_app\21_manut_escala\001 - ESCALAS\09 - ESCALAS 06SET26 A 03OUT26\01 - ESCALA SEMANAL - 06SET26 a 12SET26.xlsx'
output_js = r'C:\Users\10032221614\Downloads\cmm_app\21_manut_escala\excel_template_b64.js'

with open(template_path, 'rb') as f:
    b64_str = base64.b64encode(f.read()).decode('ascii')

with open(output_js, 'w', encoding='utf-8') as f:
    f.write(f'const EXCEL_TEMPLATE_BASE64 = "{b64_str}";\n')

print(f"Generated {output_js} with {len(b64_str)} bytes")
