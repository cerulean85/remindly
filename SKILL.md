---
name: remindly-jira-workflow
description: Remindly 프로젝트의 JIRA 이슈 처리와 커밋 작성 규칙을 따른다. Use when working on JIRA issues in the REM project, updating issue status or comments, committing related code changes, or preparing commit messages that must include REM issue keys.
---

# Remindly JIRA Workflow

## JIRA 이슈 처리

REM 프로젝트의 JIRA 이슈를 처리할 때 다음 순서를 따른다.

1. 이슈 키가 `REM-*` 형식인지 확인한다.
2. 이슈 상태가 `미해결`인지 확인한다.
3. 이슈 내용, 수락 기준, 관련 댓글을 검토해 필요한 작업을 파악한다.
4. 구현 전에 필요한 코드, 문서, 환경 정보, 외부 리소스를 수집한다.
5. 작업을 수행하고, 가능한 범위에서 테스트 또는 검증을 실행한다.
6. 변경 내용을 요약해 JIRA 댓글로 남기고, 이슈 상태를 업데이트한다.
7. 작업이 완료되면 이슈를 `완료` 상태로 변경한다.
8. 관련 변경 사항을 커밋하고 원격 저장소에 push한다.

이슈 내용이 불명확하거나 완료 기준을 판단하기 어려우면, 구현 전에 JIRA 댓글이나 사용자에게 필요한 정보를 확인한다.

## 커밋 메시지

커밋 메시지는 영어로, 현재형 명령문 형태로 작성한다.

형식:

```text
[REM-123] Type: Short summary
```

규칙:

- 제목은 가능하면 50자 이내로 작성한다.
- 제목 첫 부분에 관련 JIRA 이슈 키를 반드시 포함한다.
- 요약은 변경 사항을 명확하고 간결하게 설명한다.
- 필요할 때만 본문에 상세 설명, 테스트 결과, 주의 사항을 추가한다.
- 여러 이슈를 함께 처리한 커밋은 제목에 주요 이슈 키를 먼저 쓰고, 본문에 나머지 이슈를 언급한다.

권장 prefix:

- `Fix`: 버그 수정
- `Feature`: 기능 추가
- `Refactor`: 동작 변경 없는 구조 개선
- `Test`: 테스트 추가 또는 수정
- `Docs`: 문서 변경
- `Chore`: 설정, 빌드, 의존성 등 기타 변경

예시:

```text
[REM-123] Fix: Correct login validation
[REM-124] Feature: Add user profile page
[REM-125] Refactor: Simplify reminder scheduling
```

s
