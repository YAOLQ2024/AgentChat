import asyncio
import json

import aiohttp
from agentchat.settings import app_settings
from agentchat.schemas.rerank import RerankResultModel


class Reranker:

    @classmethod
    async def request_rerank(cls, query, documents):
        if not documents:
            return []

        headers = {
            "Authorization": f"Bearer {app_settings.multi_models.rerank.api_key}",
            "Content-Type": "application/json"
        }
        top_n = app_settings.rag.retrival.get('top_k', 5) * 2
        model = app_settings.multi_models.rerank.model_name
        url = app_settings.multi_models.rerank.base_url

        # 兼容两种 API 格式：扁平格式（SiliconFlow 等）和嵌套格式（其他供应商）
        payloads = [
            # 扁平格式
            {
                "model": model,
                "query": query,
                "documents": documents,
                "top_n": top_n,
                "return_documents": True
            },
            # 嵌套格式
            {
                "model": model,
                "input": {
                    "query": query,
                    "documents": documents
                },
                "parameters": {
                    "return_documents": True,
                    "top_n": top_n
                }
            }
        ]

        async with aiohttp.ClientSession() as session:
            for payload in payloads:
                async with session.post(url=url, headers=headers, data=json.dumps(payload)) as response:
                    if response.status == 200:
                        result = await response.json()
                        # 兼容两种返回格式
                        return result.get('results') or result.get('output', {}).get('results', [])
                    elif response.status == 400:
                        continue  # 格式不对，尝试下一种
                    else:
                        response.raise_for_status()
            return []

    @classmethod
    async def rerank_documents(cls, query, documents):
        final_documents = []
        original_documents = documents

        results = await cls.request_rerank(query, documents)

        for result in results:
            result['document'] = original_documents[result['index']]

            final_documents.append(RerankResultModel(query=query, content=result['document'],
                                                     score=result['relevance_score'], index=result['index']))
        return final_documents

if __name__ == "__main__":
    asyncio.run(Reranker.rerank_documents(query="什么是文本排序模型", documents=[
            "文本排序模型广泛用于搜索引擎和推荐系统中，它们根据文本相关性对候选文本进行排序",
            "量子计算是计算科学的一个前沿领域",
            "预训练语言模型的发展给文本排序模型带来了新的进展"
        ]))