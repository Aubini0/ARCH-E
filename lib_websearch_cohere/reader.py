import aiohttp
from bs4 import BeautifulSoup
from aiohttp import ClientTimeout


class Web_Reader : 
    def __init__(self) -> None:
        self.headers = {
            'accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7',
            'accept-language': 'en-US,en;q=0.9',
            # 'cookie': 'redirect_to_int=1; locale=en; sb_fs_id=a2597159-65e3-4e1c-9605-a50a0e753b03; sb_fs_flag=false; device-id=d7c8b013-2bf8-44c3-b895-6e643297b7e9; sb_country=ng; deviceId=240305121548bdid91961637; usrId=240305121548pdid91961638; userId=p231008131543puid60551532; selfExclusionEndDate=0; userCert=350; currency=; phone=8062998750; _ga_HTPQ490VV2=GS1.2.1712210992.10.0.1712210992.60.0.0; accessToken=patron:id:accesstoken:319cd40c7f2f9b1282a33ff04a8f88f93FXgtb0pkI0AjrOa9Frsq+YU7AMBsDpCnvwVytRig6QAXGiAF30hQquw2Ac6IMpuPW/fJ/lqbDxyqxDoBdyR7Q==; _gcl_au=1.1.832044302.1719575868; _gid=GA1.2.267889988.1721078870; _ga=GA1.1.1948717096.1709081038; _ga_NBP9M63NMT=GS1.1.1721078871.11.0.1721078871.0.0.0; _ga_00HZ52K43N=GS1.1.1721078869.19.0.1721078916.13.0.0; _ga_D9PX9RRZRJ=GS1.1.1721078869.5.0.1721078916.0.0.0',
            'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36',
        }
    

    async def read_text(self, url):
        try:
            async with aiohttp.ClientSession(headers=self.headers , timeout= ClientTimeout(5) ) as session:
                async with session.get(url) as response:
                    content = await response.text()
                    soup = BeautifulSoup(content, "html.parser")

                    for script in soup(["script", "style", "header", "footer", "nav", "aside", "meta"]):
                        script.decompose()

                    content = soup.findAll(['p', 'li', 'h1', 'h2', 'h3', 'h4', 'h5', 'code'])
                    text = ''

                    for line in content:
                        if line.name == 'li':
                            text += (' ' * 4 + line.text.strip() + "\n")
                        elif line.name.startswith('h'):
                            text += (line.text.strip() + "\n")
                        elif line.name == 'code':
                            text += ("```````" + "\n" + line.text.strip() + "\n" + "```````" + "\n")
                        else:
                            text += (line.text.strip() + "\n")

                    text = text.strip()
                    return {"status": True, "page_content": text}

        except Exception as e:
            return {"status": False, "error": str(e)}