# dahae-deployer

다해 2호 홈클리닝 대량배포 전용 저장소.

## 구조
- `admin.html` : 100 / 5,000 / 8,000 / 10,000 페이지 배포 설정
- `scripts/generate.mjs` : Netlify build 시 정적 페이지 생성
- `data/services.json` : 홈클리닝 업종/제목 변형
- `data/regions.json` : 지역 시드
- `netlify/functions/start-deploy.mjs` : GitHub의 deploy-config.json을 갱신해 자동 배포 유도
- `deploy-config.json` : 생성 페이지 수

## Netlify 환경변수
- `GITHUB_TOKEN` : dahae-deployer 저장소 Contents read/write 권한이 있는 fine-grained PAT
- `GITHUB_OWNER` = `hangjin-clean`
- `GITHUB_REPO` = `dahae-deployer`
- `GITHUB_BRANCH` = `main`

## 첫 연결
Netlify에서 GitHub의 `hangjin-clean/dahae-deployer`를 Import하면 됩니다.
Build command: `npm run build`
Publish directory: `dist`
