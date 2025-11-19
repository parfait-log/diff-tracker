# 문서 변경사항 추적기 📝

텍스트와 워드 문서(.docx)의 변경사항을 글자 단위로 비교하는 웹 애플리케이션입니다.

## 주요 기능

- ✅ 글자 단위 정밀 비교 (한글, 영문 지원)
- ✅ 워드 문서(.docx) 및 텍스트 파일(.txt) 업로드
- ✅ 실시간 텍스트 입력 및 비교
- ✅ 변경사항 통계 (추가/삭제/총 변경)
- ✅ 변경사항 네비게이션 (이전/다음)
- ✅ 워드 스타일 변경 표시 (추가=초록색 밑줄, 삭제=빨간색 취소선)
- ✅ 완전한 클라이언트 사이드 처리 (서버 전송 없음)

## 로컬 실행 방법

### 1. 저장소 클론
```bash
git clone https://github.com/your-username/document-diff-tracker.git
cd document-diff-tracker
```

### 2. 의존성 설치
```bash
npm install
```

### 3. 개발 서버 실행
```bash
npm start
```

브라우저에서 `http://localhost:3000` 자동 실행됩니다.

## GitHub Pages 배포 방법

### 방법 1: 수동 배포

1. **빌드 생성**
```bash
npm run build
```

2. **gh-pages 설치**
```bash
npm install --save-dev gh-pages
```

3. **package.json에 스크립트 추가**
```json
"scripts": {
  "predeploy": "npm run build",
  "deploy": "gh-pages -d build"
}
```

4. **배포**
```bash
npm run deploy
```

5. **GitHub 저장소 설정**
   - GitHub 저장소 → Settings → Pages
   - Source: `gh-pages` 브랜치 선택
   - 몇 분 후 `https://your-username.github.io/document-diff-tracker/` 에서 접속 가능

### 방법 2: GitHub Actions 자동 배포 (추천)

1. **.github/workflows/deploy.yml 파일 생성**
```yaml
name: Deploy to GitHub Pages

on:
  push:
    branches: [ main ]

jobs:
  build-and-deploy:
    runs-on: ubuntu-latest
    
    steps:
    - uses: actions/checkout@v3
    
    - name: Setup Node.js
      uses: actions/setup-node@v3
      with:
        node-version: '18'
        
    - name: Install dependencies
      run: npm install
      
    - name: Build
      run: npm run build
      
    - name: Deploy
      uses: peaceiris/actions-gh-pages@v3
      with:
        github_token: ${{ secrets.GITHUB_TOKEN }}
        publish_dir: ./build
```

2. **코드 푸시**
```bash
git add .
git commit -m "Initial commit"
git push origin main
```

3. **자동 배포 확인**
   - GitHub Actions 탭에서 배포 진행상황 확인
   - 완료 후 Settings → Pages에서 URL 확인

## 사용 방법

1. **원본 문서**: 왼쪽에 원본 텍스트 입력 또는 파일 업로드
2. **수정 문서**: 오른쪽에 수정된 텍스트 입력 또는 파일 업로드
3. **자동 비교**: 실시간으로 변경사항 하단에 표시
4. **네비게이션**: ↑↓ 버튼으로 변경사항 사이 이동

## 기술 스택

- React 18
- mammoth.js (워드 문서 파싱)
- lucide-react (아이콘)
- CSS (커스텀 유틸리티 클래스)

## 개인정보 보호

- 모든 처리는 브라우저에서만 실행됩니다
- 서버로 파일이 전송되지 않습니다
- 페이지를 새로고침하면 모든 데이터가 삭제됩니다

## 라이선스

MIT License

## 문의

이슈나 개선 제안은 GitHub Issues를 통해 남겨주세요.
