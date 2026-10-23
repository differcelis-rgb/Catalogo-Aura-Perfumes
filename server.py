import http.server
import socketserver
import json
import os
import base64
import re

PORT = 8000
DIRECTORY = os.path.dirname(os.path.abspath(__file__))

class AuraHandler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=DIRECTORY, **kwargs)

    def do_POST(self):
        # API: Upload Perfume Image
        if self.path == '/api/upload-image':
            content_length = int(self.headers.get('Content-Length', 0))
            body = self.rfile.read(content_length)
            try:
                data = json.loads(body.decode('utf-8'))
                img_data_b64 = data.get('image_base64', '')
                perfume_id = data.get('id', 'temp')
                
                # Clean base64 header if present
                if ',' in img_data_b64:
                    img_data_b64 = img_data_b64.split(',', 1)[1]
                
                img_bytes = base64.b64decode(img_data_b64)
                os.makedirs(os.path.join(DIRECTORY, 'assets', 'perfumes'), exist_ok=True)
                target_path = os.path.join(DIRECTORY, 'assets', 'perfumes', f'{perfume_id}.jpg')
                
                with open(target_path, 'wb') as f:
                    f.write(img_bytes)
                
                rel_path = f'assets/perfumes/{perfume_id}.jpg'
                self.send_response(200)
                self.send_header('Content-Type', 'application/json')
                self.end_headers()
                self.wfile.write(json.dumps({'success': True, 'path': rel_path}).encode('utf-8'))
            except Exception as e:
                self.send_response(500)
                self.send_header('Content-Type', 'application/json')
                self.end_headers()
                self.wfile.write(json.dumps({'success': False, 'error': str(e)}).encode('utf-8'))
            return

        # API: Save Full Perfumes Dataset
        if self.path == '/api/save-perfumes':
            content_length = int(self.headers.get('Content-Length', 0))
            body = self.rfile.read(content_length)
            try:
                data = json.loads(body.decode('utf-8'))
                perfumes = data.get('perfumes', [])
                
                # 1. Save data/perfumes.json
                json_path = os.path.join(DIRECTORY, 'data', 'perfumes.json')
                os.makedirs(os.path.dirname(json_path), exist_ok=True)
                with open(json_path, 'w', encoding='utf-8') as f:
                    json.dump(perfumes, f, ensure_ascii=False, indent=2)
                
                # 2. Save js/perfumes-data.js
                js_path = os.path.join(DIRECTORY, 'js', 'perfumes-data.js')
                os.makedirs(os.path.dirname(js_path), exist_ok=True)
                js_content = f"// Catálogo Oficial Aura - Base de datos sincronizada\nconst PERFUMES_DATA = {json.dumps(perfumes, ensure_ascii=False, indent=2)};\n"
                with open(js_path, 'w', encoding='utf-8') as f:
                    f.write(js_content)
                
                self.send_response(200)
                self.send_header('Content-Type', 'application/json')
                self.end_headers()
                self.wfile.write(json.dumps({'success': True, 'count': len(perfumes)}).encode('utf-8'))
            except Exception as e:
                self.send_response(500)
                self.send_header('Content-Type', 'application/json')
                self.end_headers()
                self.wfile.write(json.dumps({'success': False, 'error': str(e)}).encode('utf-8'))
            return

        # Default 404
        self.send_response(404)
        self.end_headers()

if __name__ == '__main__':
    socketserver.TCPServer.allow_reuse_address = True
    with socketserver.TCPServer(("", PORT), AuraHandler) as httpd:
        print(f"Servidor Aura corriendo en http://localhost:{PORT}")
        httpd.serve_forever()
