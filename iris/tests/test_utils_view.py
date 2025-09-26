from iris.utils import View
import markupsafe


def test_view_to_json_marks_up():
    v = View("<b>Name</b>", "<i>Desc</i>", None)
    j = v.to_json()
    assert 'name' in j and 'description' in j
    assert isinstance(j['name'], markupsafe.Markup)
    assert isinstance(j['description'], markupsafe.Markup)
