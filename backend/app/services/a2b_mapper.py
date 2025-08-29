import logging
import pandas as pd
from typing import List
from uuid import uuid4
from app.models.mapping import Edge, Node


logger = logging.getLogger(__name__)


class A2BMapper:
    def __init__(self):
        self.nodes = {}

    async def cleanup(self):
        logger.info("Cleaning up resources in A2BMapper")
        self.nodes.clear()

    def create_session_ids(self, df):
        """Create session IDs for the DataFrame.

        Args:
            df (pd.DataFrame): The input DataFrame.

        Returns:
            pd.DataFrame: The DataFrame with session IDs.
        """
        if "session_id" in df.columns and df["session_id"].notnull().all():
            logger.info("Session IDs already present in data, Skipping...")
            return df
        else:
            df["session_id"] = [str(uuid4()) for _ in range(len(df))]
            return df

    def create_node(self, ip: str, phone: str):
        """Create a new node or return an existing one.

        Args:
            ip (str): The IP address of the node.
            phone (str): The phone number of the node.

        Returns:
            Node: The created or existing node.
        """
        ip = str(ip)
        phone = str(phone)
        
        # Check if node already exists
        if self.nodes.get((ip, phone)):
            return Node(
                node_id=self.nodes[(ip, phone)],
                ip=ip,
                phone=phone
            )

        # Create a new node
        node = Node(
            node_id=str(uuid4()),
            ip=ip,
            phone=phone,
        )

        # Store the new node
        self.nodes[(ip, phone)] = node.node_id
        return node

    def get_mappings(self, df: pd.DataFrame) -> List[Edge]:
        # Create sessions ids
        df = self.create_session_ids(df)

        # Create Edge mappings
        mappings = []
        for _, row in df.iterrows():
            # print(row)
            
            srcNode = self.create_node(row["src_ip"], row["src_phone"])
            dstNode = self.create_node(row["dst_ip"], row["dst_phone"])
            
            edge = Edge(
                session_id=row["session_id"],
                timestamp=row["timestamp"],
                protocol=row["protocol"],
                duration_sec=row["duration_sec"],
                bytes=row["bytes"],
                src=srcNode,
                dst=dstNode,
                cell_tower_lat=row["cell_tower_lat"],
                cell_tower_lon=row["cell_tower_lon"],
            )
            mappings.append(edge)
        
        logger.info(f"Total unique nodes created: {len(self.nodes)}")
        logger.info(f"Generated {len(mappings)} A->B mappings")
        return mappings 