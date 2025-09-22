const Item = require('../models/Item');

// Criar um novo item
exports.criarItem = async (req, res) => {
  try {
    const novoItem = new Item(req.body);
    const itemSalvo = await novoItem.save();
    
    res.status(201).json({
      sucesso: true,
      mensagem: 'Item criado com sucesso',
      data: itemSalvo
    });
  } catch (error) {
    res.status(400).json({
      sucesso: false,
      mensagem: 'Erro ao criar item',
      erro: error.message
    });
  }
};

// Listar todos os itens
exports.listarItens = async (req, res) => {
  try {
    const { tipo, ramo, nivel, page = 1, limit = 10 } = req.query;
    
    // Construir filtros
    const filtros = {};
    if (tipo) filtros.tipo = tipo;
    if (ramo) filtros.ramo = ramo;
    if (nivel) filtros.nivel = nivel;
    
    // Paginação
    const skip = (page - 1) * limit;
    
    const itens = await Item.find(filtros)
      .skip(skip)
      .limit(parseInt(limit))
      .sort({ createdAt: -1 });
    
    const total = await Item.countDocuments(filtros);
    
    res.status(200).json({
      sucesso: true,
      data: itens,
      paginacao: {
        paginaAtual: parseInt(page),
        totalPaginas: Math.ceil(total / limit),
        totalItens: total,
        itensPorPagina: parseInt(limit)
      }
    });
  } catch (error) {
    res.status(500).json({
      sucesso: false,
      mensagem: 'Erro ao listar itens',
      erro: error.message
    });
  }
};

// Buscar item por ID
exports.buscarItemPorId = async (req, res) => {
  try {
    const item = await Item.findById(req.params.id);
    
    if (!item) {
      return res.status(404).json({
        sucesso: false,
        mensagem: 'Item não encontrado'
      });
    }
    
    res.status(200).json({
      sucesso: true,
      data: item
    });
  } catch (error) {
    res.status(500).json({
      sucesso: false,
      mensagem: 'Erro ao buscar item',
      erro: error.message
    });
  }
};

// Atualizar item
exports.atualizarItem = async (req, res) => {
  try {
    const item = await Item.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );
    
    if (!item) {
      return res.status(404).json({
        sucesso: false,
        mensagem: 'Item não encontrado'
      });
    }
    
    res.status(200).json({
      sucesso: true,
      mensagem: 'Item atualizado com sucesso',
      data: item
    });
  } catch (error) {
    res.status(400).json({
      sucesso: false,
      mensagem: 'Erro ao atualizar item',
      erro: error.message
    });
  }
};

// Deletar item
exports.deletarItem = async (req, res) => {
  try {
    const item = await Item.findByIdAndDelete(req.params.id);
    
    if (!item) {
      return res.status(404).json({
        sucesso: false,
        mensagem: 'Item não encontrado'
      });
    }
    
    res.status(200).json({
      sucesso: true,
      mensagem: 'Item deletado com sucesso',
      data: item
    });
  } catch (error) {
    res.status(500).json({
      sucesso: false,
      mensagem: 'Erro ao deletar item',
      erro: error.message
    });
  }
};