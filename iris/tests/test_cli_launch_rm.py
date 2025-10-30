import pytest
from unittest.mock import patch
from iris import parse_cmd_line, handle_launch_command, handle_rm_command, find_config_file


class TestLaunchCommand:
    """Test the launch command functionality."""
    
    def test_launch_existing_project(self, tmp_path, monkeypatch):
        """Should launch existing project with config file."""
        project_dir = tmp_path / "test-project"
        project_dir.mkdir()
        config_file = project_dir / "cloud-segmentation.json"
        config_file.write_text('{"name": "test"}')
        
        monkeypatch.chdir(tmp_path)
        result = handle_launch_command("test-project")
        assert result == str(config_file)
    
    def test_launch_creates_new_project(self, tmp_path, monkeypatch):
        """Should create new project from demo when folder doesn't exist."""
        demo_dir = tmp_path / "demo"
        demo_dir.mkdir()
        demo_config = demo_dir / "cloud-segmentation.json"
        demo_config.write_text('{"name": "demo"}')
        
        monkeypatch.chdir(tmp_path)
        result = handle_launch_command("new-project")
        
        new_project_dir = tmp_path / "new-project"
        assert new_project_dir.exists()
        assert (new_project_dir / "cloud-segmentation.json").exists()
    
    def test_launch_no_config_raises_error(self, tmp_path, monkeypatch):
        """Should raise error when project has no config file."""
        project_dir = tmp_path / "test-project"
        project_dir.mkdir()
        
        monkeypatch.chdir(tmp_path)
        with pytest.raises(Exception, match="No suitable config file found"):
            handle_launch_command("test-project")


class TestRmCommand:
    """Test the rm command functionality."""
    
    def test_rm_with_confirmation(self, tmp_path, monkeypatch):
        """Should remove folder when user confirms."""
        project_dir = tmp_path / "test-project"
        project_dir.mkdir()
        
        monkeypatch.chdir(tmp_path)
        with patch('builtins.input', return_value='y'):
            with pytest.raises(SystemExit):
                handle_rm_command("test-project")
            assert not project_dir.exists()
    
    def test_rm_cancelled(self, tmp_path, monkeypatch):
        """Should not remove folder when user cancels."""
        project_dir = tmp_path / "test-project"
        project_dir.mkdir()
        
        monkeypatch.chdir(tmp_path)
        with patch('builtins.input', return_value='n'):
            with pytest.raises(SystemExit):
                handle_rm_command("test-project")
            assert project_dir.exists()
    
    def test_rm_demo_folder_blocked(self):
        """Should prevent deletion of demo folder."""
        with pytest.raises(Exception, match="Cannot remove the demo folder"):
            handle_rm_command("demo")


class TestConfigFileFinding:
    """Test config file discovery logic."""
    
    def test_prefers_cloud_segmentation_json(self, tmp_path):
        """Should prefer cloud-segmentation.json over other files."""
        config1 = tmp_path / "cloud-segmentation.json"
        config2 = tmp_path / "other-config.json"
        config1.write_text('{"name": "cloud-seg"}')
        config2.write_text('{"name": "other"}')
        
        result = find_config_file(str(tmp_path))
        assert result == str(config1)
    
    def test_fallback_to_any_json(self, tmp_path):
        """Should use any .json file as fallback."""
        config_file = tmp_path / "my-config.json"
        config_file.write_text('{"name": "test"}')
        
        result = find_config_file(str(tmp_path))
        assert result == str(config_file)