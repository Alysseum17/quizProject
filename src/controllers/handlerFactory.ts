import { Request, Response } from "express";


export const getAll =  (model:any) => async (_req:Request, res:Response) => {
    const items = await model.findMany();
    res.status(200).json({items});
}


export const getOne =  (model:any) => async (req:Request, res:Response) => {
    const { id } = req.params;
    const item = await model.findUnique({
        where: { id: +id },
    });
    res.status(200).json({ item });
}

export const createOne =  (model:any, schema:any) => async (req:Request, res:Response) => {
    let data = req.body;
    const user = (req as any).user;
    if(user) {
         data = {...req.body, author_id: user.id};
    }
    const result = schema.safeParse(data);
    if (!result.success) {
        return res.status(400).json({ error: result.error });
    }
    const newItem = await model.create({
        data: result.data
    });
    res.status(201).json({ newItem });
}

export const deleteOne =  (model:any) => async (req:Request, res:Response) => {
    const { id } = req.params;
    await model.delete({
        where: { id: +id },
    });
    res.status(204).send('Item deleted successfully');
}

export const updateOne =  (model:any, schema:any) => async (req:Request, res:Response) => {
    const { id } = req.params;
    const result = schema.safeParse(req.body);
    if (!result.success) {
        return res.status(400).json({ error: result.error });
    }
    const updatedItem = await model.update({
        where: { id: +id },
        data: result.data
    });
    res.status(200).json({ updatedItem });
}