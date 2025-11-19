# 변경 이력 (Change History)

이 문서는 프로젝트의 주요 변경사항과 해결한 문제들을 기록합니다.

## 2024년 - GitHub Actions 배포 문제 해결

### 문제 1: npm missing error 및 GitHub Actions 실패

**발견된 문제:**
- `package.json`에서 `react-scripts` 버전이 `^0.0.0`으로 잘못 설정됨
- GitHub Actions에서 빌드 실패
- npm install 시 많은 deprecated 경고 발생

**해결 과정:**

#### 1단계: react-scripts 버전 수정
- **변경 파일**: `package.json`
- **변경 내용**: `react-scripts: "^0.0.0"` → `"^5.0.1"`
- **사유**: 잘못된 버전으로 인해 의존성 설치 실패
- **커밋**: `201732b - Fix ESLint warnings and update dependencies`

#### 2단계: ESLint 경고 수정
- **변경 파일**: `src/App.js`
- **변경 내용**: 
  - `useCallback` import 추가
  - `analyzeDiff` 함수를 `useCallback`으로 감싸서 React Hook 의존성 경고 해결
- **사유**: `useEffect`의 의존성 배열에 함수를 포함해야 하는데, `useCallback`을 사용하여 메모이제이션
- **커밋**: `201732b - Fix ESLint warnings and update dependencies`

#### 3단계: .npmrc 파일 생성 및 설정
- **생성 파일**: `.npmrc`
- **초기 설정**:
  ```
  audit=false
  loglevel=error
  ```
- **최종 설정**:
  ```
  audit=false
  legacy-peer-deps=true
  ```
- **사유**: 
  - deprecated 경고를 줄이기 위해 `audit=false` 설정
  - `loglevel=error`는 GitHub Actions에서 문제를 일으킬 수 있어 제거
  - `legacy-peer-deps=true`로 의존성 충돌 해결
- **커밋**: `1a9e4ac - Fix GitHub Actions workflow: update .npmrc and use npm ci`

#### 4단계: GitHub Actions 워크플로우 수정 (1차 시도)
- **변경 파일**: `.github/workflows/deploy.yml`
- **변경 내용**: `npm install --legacy-peer-deps` → `npm ci`
- **사유**: `npm ci`가 더 빠르고 안정적이라고 생각했으나, `.npmrc`의 `legacy-peer-deps` 설정과 충돌 발생
- **커밋**: `1a9e4ac - Fix GitHub Actions workflow: update .npmrc and use npm ci`
- **결과**: 실패 - `npm ci`가 `.npmrc` 설정과 호환되지 않음

#### 5단계: GitHub Actions 워크플로우 수정 (2차 시도)
- **변경 파일**: `.github/workflows/deploy.yml`
- **변경 내용**: `npm ci` → `npm install`
- **사유**: `npm ci`는 `package-lock.json`을 엄격하게 따르는데, `.npmrc`의 `legacy-peer-deps` 설정과 충돌. `npm install`이 더 유연하게 동작
- **커밋**: `590bcb6 - Fix workflow: use npm install instead of npm ci for better compatibility`
- **결과**: 빌드는 성공했으나 배포 단계에서 git 에러 발생

#### 6단계: GitHub Actions git 권한 문제 해결
- **발견된 문제**: 
  - `The process '/usr/bin/git' failed with exit code 128`
  - Git 권한 문제로 배포 실패

- **변경 파일**: `.github/workflows/deploy.yml`
- **주요 변경사항**:
  1. **권한 수정**: `contents: read` → `contents: write`
     - GitHub Pages 배포를 위해 쓰기 권한 필요
   
  2. **Actions 버전 업데이트**:
     - `actions/checkout@v3` → `actions/checkout@v4`
     - `actions/setup-node@v3` → `actions/setup-node@v4`
   
  3. **Checkout 설정 개선**:
     - `fetch-depth: 0` 추가 (전체 git 히스토리 가져오기)
   
  4. **배포 옵션 추가**:
     - `force_orphan: true` 추가 (gh-pages 브랜치 문제 해결)
     - `if: github.ref == 'refs/heads/main'` 조건 추가

- **사유**: 
  - `contents: write` 권한이 없어서 gh-pages 브랜치에 푸시할 수 없었음
  - 최신 버전의 actions를 사용하여 안정성 향상
  - `fetch-depth: 0`으로 전체 히스토리를 가져와 git 작업이 정상 작동하도록 함
- **커밋**: `e18d0d2 - Fix GitHub Actions: update permissions and actions versions to fix git error`
- **결과**: ✅ 성공 - GitHub Actions가 정상적으로 빌드하고 배포함

## 최종 해결된 문제 요약

1. ✅ **react-scripts 버전 오류**: `^0.0.0` → `^5.0.1`로 수정
2. ✅ **ESLint 경고**: `useCallback`을 사용하여 React Hook 의존성 경고 해결
3. ✅ **npm deprecated 경고**: `.npmrc` 파일로 관리 (에러는 아니지만 경고 감소)
4. ✅ **GitHub Actions 빌드 실패**: `npm install` 사용 및 `.npmrc` 설정 조정
5. ✅ **GitHub Actions 배포 실패**: 권한 수정 및 Actions 버전 업데이트

## 최종 설정 파일

### `.npmrc`
```
audit=false
legacy-peer-deps=true
```

### `.github/workflows/deploy.yml` 주요 설정
- Node.js 버전: 18
- 설치 명령: `npm install`
- 빌드 명령: `npm run build`
- 배포 액션: `peaceiris/actions-gh-pages@v3`
- 권한: `contents: write`, `pages: write`, `id-token: write`

## 참고사항

- `npm install` 시 여전히 deprecated 경고가 나타날 수 있으나, 이는 `react-scripts` 5.0.1의 의존성 때문이며 프로젝트 동작에는 문제 없음
- GitHub Actions는 main 브랜치에 푸시할 때마다 자동으로 빌드하고 배포함
- 배포 완료 후 몇 분 내에 GitHub Pages에 반영됨

