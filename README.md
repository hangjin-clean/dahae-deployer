# 다해 2호 최종형 대량배포

1호 최종형의 운영 구조를 기준으로 2호를 독립 구현한 버전입니다.

## 핵심
- 전국 16개 시도 / 시군구 / 읍면동 + 통합 검색명
- 홈클리닝 업종 전용
- 지역당 제목 1/3/5개
- 100~8,000페이지
- 내부 배치 5/10/20
- 동시 배치 1/2/4
- 진행률 / 완료 / 실패 / 실행 / 대기 표시
- 일시정지 / 최근 작업 불러오기
- 서버 커서로 다음 후보부터 이어서 생성
- GitHub 대량 커밋 없이 Netlify Blobs 직접 공개
- 동적 sitemap.xml
- 실제 공개페이지 10개 검증
- IndexNow 1,000개 단위 등록
- 다해 승인 랜딩페이지 디자인

## 환경변수
필수 아님:
- ADMIN_KEY : 관리자 페이지 보호용
- SITE_URL = https://dahae-clean.netlify.app
- INDEXNOW_KEY : IndexNow를 사용할 때만 설정
- GENERATION_CONCURRENCY : 기본 5
- PUBLISH_CHUNK_SIZE : 기본 50

GITHUB_TOKEN은 이 버전의 대량배포에는 필요하지 않습니다.
