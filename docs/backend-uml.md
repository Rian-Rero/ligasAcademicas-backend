# UML do Backend

Documento de referência do domínio e da arquitetura do backend da aplicação.
O objetivo é registrar entidades, associações, camadas e restrições relevantes para manutenção e evolução do sistema.

## Escopo de modelagem

- A modelagem abaixo cobre o domínio persistido em MongoDB, as principais relações entre documentos e o pipeline HTTP do Express.
- Relações opcionais foram marcadas explicitamente quando a schema permite `null` ou ausência do campo.
- Entidades de integração externa, como Cloudinary e Google Calendar, aparecem como dependências e não como entidades de domínio.

## Visão de camadas

```mermaid
flowchart TB
  Client[Cliente HTTP]
  Express[app.js / Express]
  Middlewares[Middlewares globais\n+cors, cookieParser, helmet, json, urlencoded, morgan]
  Routes[Router principal\n+/sgla-api]
  Controllers[Controllers]
  Services[Services]
  Models[Models / Schemas MongoDB]
  External[Serviços externos\n+Cloudinary, Google Calendar, Mail, MongoDB]

  Client --> Express
  Express --> Middlewares --> Routes
  Routes --> Controllers --> Services --> Models --> External
  Services --> External
```

## Modelo de domínio

```mermaid
classDiagram
direction LR

class User {
  +ObjectId _id
  +String name
  +String email
  +String password
  +CloudinaryFile image
  +Boolean emailVerified
  +Boolean mustChangePassword
  +Boolean googleCalendarLinked
  +String googleCalendarEmail
  +Date googleCalendarLinkedAt
}

class University {
  +ObjectId _id
  +String name
  +String street
  +Number number
  +String complement
  +CloudinaryFile logo
}

class AcademicLeague {
  +ObjectId _id
  +ObjectId university
  +String name
  +String description
  +String area
}

class Squad {
  +ObjectId _id
  +ObjectId academicLeague
  +String name
  +String description
  +String function
}

class LeagueMembership {
  +ObjectId _id
  +ObjectId user
  +ObjectId academicLeague
  +ObjectId squad
  +ObjectId university
  +String role
  +Boolean isActive
}

class Event {
  +ObjectId _id
  +ObjectId academicLeague
  +ObjectId squad
  +String title
  +String description
  +Date dateTime
  +String location
  +String googleCalendarEventId
  +ObjectId googleCalendarUserId
}

class Attendance {
  +ObjectId _id
  +ObjectId event
  +ObjectId leagueMembership
  +Boolean isConfirmed
  +Boolean hasAttended
}

class Certificate {
  +ObjectId _id
  +ObjectId leagueMembership
  +Number workLoadHours
  +Date issueDate
  +String pdfUrl
}

class Task {
  +ObjectId _id
  +String title
  +String description
  +Date dueDate
  +Priority priority
  +ObjectId assignedTo
  +ObjectId assignedBy
  +Boolean completed
  +Date completedAt
  +String googleCalendarEventId
}

class Role {
  +ObjectId _id
  +String name
  +String key
  +String description
  +Boolean isSystem
  +Boolean isGlobal
  +ObjectId academicLeague
  +String color
  +Number priority
}

class Permission {
  +ObjectId _id
  +String key
  +String name
  +String description
  +String module
  +Boolean isSystem
}

class UserPermission {
  +ObjectId _id
  +ObjectId user
  +ObjectId academicLeague
  +ObjectId[] roles
  +ObjectId[] permissions
}

class RoleHistory {
  +ObjectId _id
  +ObjectId leagueMembership
  +ObjectId squad
  +Date startDate
  +Date endDate
}

class UserPwdToken {
  +ObjectId _id
  +ObjectId user
  +String token
  +Date createdAt
}

class UserSessionToken {
  +ObjectId _id
  +ObjectId user
  +String token
  +Date expiresAt
}

class Priority {
  <<enumeration>>
  LOW
  MEDIUM
  HIGH
}

University "1" --> "0..*" AcademicLeague : hosts
AcademicLeague "1" --> "0..*" Squad : contains
AcademicLeague "1" --> "0..*" Event : schedules
AcademicLeague "1" --> "0..*" LeagueMembership : registers
AcademicLeague "1" --> "0..*" UserPermission : scopes

User "1" --> "0..*" LeagueMembership : participates
User "1" --> "0..*" Task : assignedTo
User "1" --> "0..*" Task : assignedBy
User "1" --> "0..*" UserPermission : has
User "1" --> "0..*" UserPwdToken : passwordReset
User "1" --> "0..*" UserSessionToken : sessions

Squad "1" --> "0..*" Event : filters
Squad "1" --> "0..*" LeagueMembership : membershipScope
Squad "1" --> "0..*" RoleHistory : history
Squad "0..1" --> "0..*" LeagueMembership : optionalScope

LeagueMembership "1" --> "0..*" Attendance : records
LeagueMembership "1" --> "0..*" Certificate : certificates
LeagueMembership "1" --> "0..*" RoleHistory : roleTimeline

Event "1" --> "0..*" Attendance : attendance

Role "0..*" -- "0..*" Permission : grants
UserPermission "0..*" -- "0..*" Role : assigns
UserPermission "0..*" -- "0..*" Permission : overrides

Task ..> Priority : uses
Event ..> User : googleCalendarUserId
Event ..> Squad : optional squad

note for LeagueMembership "Junction/association entity.\nA schema permite academicLeague, squad e university opcionais,\nmas a regra de negócio pode restringir combinações válidas no service layer."
note for Attendance "Chave composta única em { event, leagueMembership }."
note for UserPermission "Índice único esparso em { user, academicLeague }."
note for UserPwdToken "TTL de 15 minutos a partir de createdAt."
note for UserSessionToken "TTL baseado em expiresAt."
```

## Restrições importantes

- `User.email`, `University.name`, `AcademicLeague.name`, `Squad.name` e `Permission.key` são únicos.
- `Role.key` é único e pode representar papéis globais ou específicos de liga.
- `Attendance` não permite duplicidade para o mesmo par evento + membership.
- `UserSessionToken` e `UserPwdToken` expiram automaticamente no MongoDB.
- Os hooks de deleção removem efeitos colaterais relevantes, como tokens de sessão e arquivos remotos do Cloudinary.

## Leitura arquitetural

- `routes/` expõe a superfície HTTP.
- `controllers/` coordenam validação, autorização e orquestração.
- `services/` concentram regra de negócio e integrações externas.
- `models/` definem o contrato persistido e as invariantes da base.
