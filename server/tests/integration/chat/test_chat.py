import pytest

from openslides.chat.models import ChatGroup, ChatMessage
from openslides.utils.auth import get_group_model
from tests.count_queries import count_queries


@pytest.mark.django_db(transaction=False)
def test_motion_db_queries():
    """
    Tests that only the following db queries for chat groups are done:
    * 1 request to get all chat groups
    * 1 request to get all read groups
    * 1 request to get all write groups

    Tests that only the following db queries for chat messages are done:
    * 1 request to fet all chat messages
    * 1 request to get all chat groups
    * 1 request to get all read groups
    * 1 request to get all write groups
    """
    group1 = get_group_model().objects.create(name="group1")
    group2 = get_group_model().objects.create(name="group2")
    group3 = get_group_model().objects.create(name="group3")
    group4 = get_group_model().objects.create(name="group4")

    for i1 in range(5):
        chatgroup = ChatGroup.objects.create(name=f"motion{i1}")
        chatgroup.read_groups.add(group1, group2)
        chatgroup.write_groups.add(group3, group4)

        for i2 in range(10):
            ChatMessage.objects.create(
                text=f"text-{i1}-{i2}",
                username=f"user-{i1}-{i2}",
                user_id=i1 * 1000 + i2,
                chatgroup=chatgroup,
            )

    assert count_queries(ChatGroup.get_elements)() == 3
    assert count_queries(ChatMessage.get_elements)() == 4
