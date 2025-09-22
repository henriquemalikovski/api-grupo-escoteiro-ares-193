# cURLs para Teste da API - Sistema de Estoque Escoteiro

## Base URL
```
http://localhost:3000
```

## 1. Rota de Teste (Health Check)
```bash
curl --request GET \
  --url http://localhost:3000/ \
  --header 'Content-Type: application/json'
```

## 2. Criar Item (POST)
```bash
curl --request POST \
  --url http://localhost:3000/api/v1/itens \
  --header 'Content-Type: application/json' \
  --data '{
    "tipo": "Distintivo de Especialidade",
    "nivel": "Nível 1",
    "descricao": "Teste API",
    "quantidade": 5,
    "valorUnitario": 2.50,
    "ramo": "Jovens"
  }'
```

## 3. Listar Todos os Itens (GET)
```bash
curl --request GET \
  --url http://localhost:3000/api/v1/itens \
  --header 'Content-Type: application/json'
```

## 4. Listar Itens com Paginação
```bash
curl --request GET \
  --url 'http://localhost:3000/api/v1/itens?page=1&limit=5' \
  --header 'Content-Type: application/json'
```

## 5. Filtrar por Tipo
```bash
curl --request GET \
  --url 'http://localhost:3000/api/v1/itens?tipo=Distintivo%20de%20Especialidade' \
  --header 'Content-Type: application/json'
```

## 6. Filtrar por Ramo
```bash
curl --request GET \
  --url 'http://localhost:3000/api/v1/itens?ramo=Jovens' \
  --header 'Content-Type: application/json'
```

## 7. Filtrar por Nível
```bash
curl --request GET \
  --url 'http://localhost:3000/api/v1/itens?nivel=N%C3%ADvel%201' \
  --header 'Content-Type: application/json'
```

## 8. Filtros Combinados
```bash
curl --request GET \
  --url 'http://localhost:3000/api/v1/itens?tipo=Distintivo&ramo=Jovens&page=1&limit=10' \
  --header 'Content-Type: application/json'
```

## 9. Buscar Item por ID (GET)
```bash
# Substitua {item_id} por um ID real do banco
curl --request GET \
  --url http://localhost:3000/api/v1/itens/{item_id} \
  --header 'Content-Type: application/json'
```

## 10. Atualizar Item (PUT)
```bash
# Substitua {item_id} por um ID real do banco
curl --request PUT \
  --url http://localhost:3000/api/v1/itens/{item_id} \
  --header 'Content-Type: application/json' \
  --data '{
    "tipo": "Distintivo de Especialidade",
    "nivel": "Nível 2",
    "descricao": "Teste API Atualizado",
    "quantidade": 10,
    "valorUnitario": 3.00,
    "ramo": "Sênior"
  }'
```

## 11. Atualizar Parcialmente (PUT)
```bash
# Substitua {item_id} por um ID real do banco
curl --request PUT \
  --url http://localhost:3000/api/v1/itens/{item_id} \
  --header 'Content-Type: application/json' \
  --data '{
    "quantidade": 15,
    "valorUnitario": 4.50
  }'
```

## 12. Deletar Item (DELETE)
```bash
# Substitua {item_id} por um ID real do banco
curl --request DELETE \
  --url http://localhost:3000/api/v1/itens/{item_id} \
  --header 'Content-Type: application/json'
```

## Exemplos com Dados Reais

### 13. Criar Distintivo de Especialidade
```bash
curl --request POST \
  --url http://localhost:3000/api/v1/itens \
  --header 'Content-Type: application/json' \
  --data '{
    "tipo": "Distintivo de Especialidade",
    "nivel": "Nível 3",
    "descricao": "Escalada",
    "quantidade": 8,
    "valorUnitario": 1.40,
    "ramo": "Jovens"
  }'
```

### 14. Criar Certificado
```bash
curl --request POST \
  --url http://localhost:3000/api/v1/itens \
  --header 'Content-Type: application/json' \
  --data '{
    "tipo": "Certificado",
    "nivel": "Não Tem",
    "descricao": "Certificado de Teste",
    "quantidade": 25,
    "valorUnitario": 2.00,
    "ramo": "Escoteiro"
  }'
```

### 15. Criar Distintivo de Progressão
```bash
curl --request POST \
  --url http://localhost:3000/api/v1/itens \
  --header 'Content-Type: application/json' \
  --data '{
    "tipo": "Distintivo de Progressão",
    "nivel": "Não Tem",
    "descricao": "Distintivo Teste Ramo Lobinho",
    "quantidade": 12,
    "valorUnitario": 3.90,
    "ramo": "Lobinho"
  }'
```

### 16. Buscar Itens do Ramo Lobinho
```bash
curl --request GET \
  --url 'http://localhost:3000/api/v1/itens?ramo=Lobinho&limit=20' \
  --header 'Content-Type: application/json'
```

### 17. Buscar Certificados
```bash
curl --request GET \
  --url 'http://localhost:3000/api/v1/itens?tipo=Certificado' \
  --header 'Content-Type: application/json'
```

### 18. Buscar Itens Nível 1
```bash
curl --request GET \
  --url 'http://localhost:3000/api/v1/itens?nivel=N%C3%ADvel%201&page=1&limit=15' \
  --header 'Content-Type: application/json'
```

## Códigos de Status Esperados

- **200 OK**: Operação realizada com sucesso (GET, PUT)
- **201 Created**: Item criado com sucesso (POST)
- **400 Bad Request**: Dados inválidos
- **404 Not Found**: Item não encontrado
- **500 Internal Server Error**: Erro interno do servidor

## Estrutura da Resposta de Sucesso

### Resposta de Item Único:
```json
{
  "sucesso": true,
  "mensagem": "Operação realizada com sucesso",
  "data": {
    "_id": "...",
    "tipo": "...",
    "nivel": "...",
    "descricao": "...",
    "quantidade": 0,
    "valorUnitario": 0,
    "valorTotal": 0,
    "ramo": "...",
    "createdAt": "...",
    "updatedAt": "..."
  }
}
```

### Resposta de Lista com Paginação:
```json
{
  "sucesso": true,
  "data": [...],
  "paginacao": {
    "paginaAtual": 1,
    "totalPaginas": 5,
    "totalItens": 50,
    "itensPorPagina": 10
  }
}
```

## Como Usar no Insomnia

1. Crie uma nova Collection chamada "API Estoque Escoteiro"
2. Crie um Environment com a variável `base_url` = `http://localhost:3000`
3. Para cada cURL acima, crie uma nova Request no Insomnia
4. Substitua `http://localhost:3000` por `{{ _.base_url }}`
5. Para os endpoints que precisam de ID, use uma variável `item_id`